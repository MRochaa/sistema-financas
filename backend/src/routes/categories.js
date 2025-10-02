import express from 'express';
import supabase from '../config/supabase.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', req.userId)
      .order('name');

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Error fetching categories' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { name, type, color } = req.body;

    const { data, error } = await supabase
      .from('categories')
      .insert([{ name, type, color, user_id: req.userId }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Error creating category' });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { name, type, color } = req.body;

    const { data, error } = await supabase
      .from('categories')
      .update({ name, type, color })
      .eq('id', req.params.id)
      .eq('user_id', req.userId)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ error: 'Error updating category' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.userId);

    if (error) throw error;
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Error deleting category' });
  }
});

export default router;
