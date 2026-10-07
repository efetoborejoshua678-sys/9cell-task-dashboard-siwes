const express = require('express');
const router = express.Router();
const Task = require('../models/Task');

// All routes here run behind requireAuth (mounted in server.js), so req.userId is set.

// GET /api/tasks?priority=high&category=Work&dueBefore=2026-01-01&search=report
router.get('/', async (req, res) => {
  try {
    const { priority, category, search, dueBefore, dueAfter } = req.query;
    const filter = { userId: req.userId };

    if (priority) filter.priority = priority;
    if (category) filter.category = category;

    if (dueBefore || dueAfter) {
      filter.dueDate = {};
      if (dueBefore) filter.dueDate.$lte = new Date(dueBefore);
      if (dueAfter) filter.dueDate.$gte = new Date(dueAfter);
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const tasks = await Task.find(filter).sort({ status: 1, order: 1, createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch tasks', error: err.message });
  }
});

// GET /api/tasks/:id
router.get('/:id', async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, userId: req.userId });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch task', error: err.message });
  }
});

// POST /api/tasks
router.post('/', async (req, res) => {
  try {
    const task = new Task({ ...req.body, userId: req.userId });
    const saved = await task.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: 'Failed to create task', error: err.message });
  }
});

// PUT /api/tasks/:id  (full edit: title, description, due date, priority, category, etc.)
router.put('/:id', async (req, res) => {
  try {
    const { userId, ...updates } = req.body; // never trust a userId from the client
    const updated = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      updates,
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ message: 'Task not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: 'Failed to update task', error: err.message });
  }
});

// PATCH /api/tasks/:id/move  (lightweight update used by drag-and-drop: status + order only)
router.patch('/:id/move', async (req, res) => {
  try {
    const { status, order } = req.body;
    const updated = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { ...(status && { status }), ...(order !== undefined && { order }) },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ message: 'Task not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: 'Failed to move task', error: err.message });
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Task.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!deleted) return res.status(404).json({ message: 'Task not found' });
    res.json({ message: 'Task deleted', id: req.params.id });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete task', error: err.message });
  }
});

module.exports = router;
