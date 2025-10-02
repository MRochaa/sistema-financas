import express from 'express';
import supabase from '../config/supabase.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*, categories(*)')
      .eq('user_id', req.userId)
      .order('date', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Error fetching transactions' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { type, amount, description, date, category_id } = req.body;

    const { data, error } = await supabase
      .from('transactions')
      .insert([{
        type,
        amount,
        description,
        date,
        category_id,
        user_id: req.userId
      }])
      .select('*, categories(*)')
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({ error: 'Error creating transaction' });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { type, amount, description, date, category_id } = req.body;

    const { data, error } = await supabase
      .from('transactions')
      .update({ type, amount, description, date, category_id })
      .eq('id', req.params.id)
      .eq('user_id', req.userId)
      .select('*, categories(*)')
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({ error: 'Error updating transaction' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.userId);

    if (error) throw error;
    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({ error: 'Error deleting transaction' });
  }
});

export default router;
