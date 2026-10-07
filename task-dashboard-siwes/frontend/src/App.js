import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import TaskForm from './components/TaskForm';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';

const dashboardPreviewEnabled = process.env.NODE_ENV === 'development'
  && new URLSearchParams(window.location.search).get('preview') === 'dashboard';

const previewTasks = [
  { id: 'preview-1', title: 'Finalize sprint priorities', description: 'Align the team on this week\'s focus.', priority: 'high', category: 'Product', status: 'todo', due_date: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString() },
  { id: 'preview-2', title: 'Review onboarding flow', description: 'Check the latest screens and handoff notes.', priority: 'medium', category: 'Design', status: 'todo', due_date: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString() },
  { id: 'preview-3', title: 'Connect Supabase auth', description: 'Verify sign-in and profile creation.', priority: 'high', category: 'Engineering', status: 'in-progress', due_date: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString() },
  { id: 'preview-4', title: 'Polish dashboard layout', description: 'Review the board at desktop and mobile sizes.', priority: 'low', category: 'UI/UX', status: 'in-progress', due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'preview-5', title: 'Create task schema', description: 'Add task fields and status constraints.', priority: 'medium', category: 'Backend', status: 'done', due_date: null },
  { id: 'preview-6', title: 'Set up project workspace', description: 'Prepare the app structure for the team.', priority: 'low', category: 'Operations', status: 'done', due_date: null },
];

function getUserDisplayName(user) {
  const metadata = user.user_metadata || {};
  const providerName = typeof metadata.name === 'string'
    ? metadata.name
    : [metadata.name?.firstName, metadata.name?.lastName].filter(Boolean).join(' ');

  return (metadata.full_name || providerName || [metadata.given_name || metadata.first_name, metadata.family_name || metadata.last_name].filter(Boolean).join(' ')).trim();
}

export default function App() {
  const [screen, setScreen] = useState(() => dashboardPreviewEnabled ? 'dashboard' : 'landing');
  const [authMode, setAuthMode] = useState('login');
  const [session, setSession] = useState(null);
  const [profileName, setProfileName] = useState('');
  const [tasks, setTasks] = useState([]);
  const [authError, setAuthError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [oauthProvider, setOauthProvider] = useState('');
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskError, setTaskError] = useState('');
  const [isSavingTask, setIsSavingTask] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptedTerms: false,
  });

  // ── Theme management ─────────────────────────────────────────────────
  const [theme, setTheme] = useState(() => localStorage.getItem('td-theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('td-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  useEffect(() => {
    const initializeSession = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);
      if (currentSession) {
        setScreen('dashboard');
      }
    };

    initializeSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      if (currentSession) {
        setScreen('dashboard');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) {
      setTasks([]);
      return;
    }

    const loadTasks = async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading tasks:', error.message);
        return;
      }

      setTasks(data || []);
    };

    loadTasks();

    // Subscribe to Realtime changes on 'tasks' table for live multi-tab sync
    const taskChannel = supabase
      .channel('tasks-realtime-sync')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${session.user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTasks((prev) => [payload.new, ...prev.filter((t) => t.id !== payload.new.id)]);
          } else if (payload.eventType === 'UPDATE') {
            setTasks((prev) => prev.map((t) => (t.id === payload.new.id ? payload.new : t)));
          } else if (payload.eventType === 'DELETE') {
            setTasks((prev) => prev.filter((t) => t.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(taskChannel);
    };
  }, [session]);

  useEffect(() => {
    let cancelled = false;

    if (!session?.user) {
      setProfileName('');
      return undefined;
    }

    const user = session.user;
    const metadataName = getUserDisplayName(user);
    const emailName = user.email?.split('@')[0] || '';

    const loadProfileName = async () => {
      const { data: profile, error: lookupError } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .maybeSingle();

      if (lookupError) {
        console.warn('Profile lookup warning:', lookupError.message);
      }

      let profileUsername = profile?.username?.trim() || '';
      if (!profileUsername) {
        const usernameBase = metadataName || emailName || 'user';
        const username = `${usernameBase}-${user.id.slice(0, 6)}`;
        const { data, error } = await supabase
          .from('profiles')
          .upsert(
            { id: user.id, username, email: user.email || null },
            { onConflict: 'id' }
          )
          .select('username')
          .maybeSingle();

        if (error) {
          console.warn('Profile sync warning:', error.message);
        } else {
          profileUsername = data?.username || username;
        }
      }

      if (!cancelled) {
        setProfileName(metadataName || profileUsername || emailName || 'User');
      }
    };

    loadProfileName();
    return () => { cancelled = true; };
  }, [session]);

  const handleAuthSubmit = async (event) => {
    event.preventDefault();
    setAuthError('');
    setIsSubmitting(true);

    try {
      if (authMode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email.trim(),
          password: formData.password,
        });

        if (error) throw error;
      } else {
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Your passwords do not match.');
        }

        if (!formData.acceptedTerms) {
          throw new Error('Please accept the terms and conditions to continue.');
        }

        const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim();
        const username = fullName || formData.email.split('@')[0];
        const { data, error } = await supabase.auth.signUp({
          email: formData.email.trim(),
          password: formData.password,
          options: { data: { full_name: fullName } },
        });

        if (error) throw error;

        if (data?.user) {
          const { error: profileError } = await supabase.from('profiles').upsert(
            {
              id: data.user.id,
              username,
              email: data.user.email,
            },
            { onConflict: 'id' }
          );

          if (profileError) {
            console.warn('Profile sync warning:', profileError.message);
          }
        }
      }

      setFormData({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '', acceptedTerms: false });
      setScreen('dashboard');
    } catch (error) {
      setAuthError(error.message || 'Authentication failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOAuthSignIn = async (provider) => {
    setAuthError('');
    setOauthProvider(provider);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: window.location.origin },
      });

      if (error) throw error;
    } catch (error) {
      setAuthError(error.message || `Unable to continue with ${provider}.`);
      setOauthProvider('');
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setTasks([]);
    setScreen('landing');
    setSession(null);
  };

  const openTaskForm = (task = null) => {
    setEditingTask(task);
    setTaskError('');
    setIsTaskFormOpen(true);
  };

  const closeTaskForm = () => {
    setIsTaskFormOpen(false);
    setEditingTask(null);
    setTaskError('');
  };

  const handleTaskSubmit = async (taskData) => {
    if (!session?.user?.id) return;

    setTaskError('');
    setIsSavingTask(true);
    const payload = {
      user_id: session.user.id,
      title: taskData.title.trim(),
      description: taskData.description.trim(),
      due_date: taskData.dueDate,
      priority: taskData.priority,
      category: taskData.category,
      status: taskData.status,
    };

    try {
      const query = editingTask
        ? supabase.from('tasks').update(payload).eq('id', editingTask.id).eq('user_id', session.user.id)
        : supabase.from('tasks').insert(payload);
      const { data, error } = await query.select().single();

      if (error) throw error;

      setTasks((currentTasks) => editingTask
        ? currentTasks.map((task) => (task.id === data.id ? data : task))
        : [data, ...currentTasks]);
      closeTaskForm();
    } catch (error) {
      setTaskError(error.message || 'Unable to save this task.');
    } finally {
      setIsSavingTask(false);
    }
  };

  const handleDeleteTask = async (task) => {
    if (!session?.user?.id || !window.confirm(`Delete "${task.title}"?`)) return;

    setTaskError('');
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', task.id)
      .eq('user_id', session.user.id);

    if (error) {
      setTaskError(error.message || 'Unable to delete this task.');
      return;
    }

    setTasks((currentTasks) => currentTasks.filter((currentTask) => currentTask.id !== task.id));
  };

  const handleToggleTask = async (task) => {
    if (!session?.user?.id) return;

    const status = task.status === 'done' ? 'todo' : 'done';
    const { data, error } = await supabase
      .from('tasks')
      .update({ status })
      .eq('id', task.id)
      .eq('user_id', session.user.id)
      .select()
      .single();

    if (error) {
      setTaskError(error.message || 'Unable to update this task.');
      return;
    }

    setTasks((currentTasks) => currentTasks.map((currentTask) => (currentTask.id === data.id ? data : currentTask)));
    setTaskError('');
  };

  const handleMoveTask = async (taskId, newStatus, newOrder) => {
    if (!session?.user?.id) return;

    // Optimistic UI update
    setTasks((currentTasks) =>
      currentTasks.map((t) =>
        t.id === taskId ? { ...t, status: newStatus, task_order: newOrder } : t
      )
    );

    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus, task_order: newOrder })
      .eq('id', taskId)
      .eq('user_id', session.user.id);

    if (error) {
      console.warn('Failed to persist task move to Supabase:', error.message);
    }
  };

  const isReadOnlyPreview = dashboardPreviewEnabled && !session;

  return (
    <div className="page-shell">
      {screen === 'landing' ? (
        <LandingPage
          onStart={() => { setAuthMode('signup'); setScreen('login'); }}
          onLogin={() => { setAuthMode('login'); setScreen('login'); }}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      ) : screen === 'dashboard' ? (
        <DashboardPage
          tasks={isReadOnlyPreview ? previewTasks : tasks}
          userEmail={isReadOnlyPreview ? 'Design preview' : session?.user?.email || 'User'}
          userName={isReadOnlyPreview ? 'Design preview' : profileName || session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || 'User'}
          onBackToLanding={isReadOnlyPreview ? () => setScreen('landing') : handleSignOut}
          onCreateTask={isReadOnlyPreview ? undefined : () => openTaskForm()}
          onEditTask={isReadOnlyPreview ? undefined : openTaskForm}
          onDeleteTask={isReadOnlyPreview ? undefined : handleDeleteTask}
          onToggleTask={isReadOnlyPreview ? undefined : handleToggleTask}
          onMoveTask={isReadOnlyPreview ? undefined : handleMoveTask}
          taskError={taskError}
          previewMode={isReadOnlyPreview}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      ) : (
        <AuthPage
          mode={authMode}
          setMode={setAuthMode}
          onBackToLanding={() => setScreen('landing')}
          onSubmit={handleAuthSubmit}
          formData={formData}
          setFormData={setFormData}
          isSubmitting={isSubmitting}
          oauthProvider={oauthProvider}
          onOAuth={handleOAuthSignIn}
          error={authError}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      )}
      {isTaskFormOpen && (
        <TaskForm
          initialTask={editingTask ? { ...editingTask, dueDate: editingTask.due_date } : null}
          onSubmit={handleTaskSubmit}
          onCancel={closeTaskForm}
          isSubmitting={isSavingTask}
          serverError={taskError}
        />
      )}
    </div>
  );
}
