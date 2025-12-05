import { Router } from 'express';

const router = Router();

// Placeholder routes - implement based on your needs
router.get('/', (req, res) => {
  res.json({
    success: true,
    packages: [
      { id: '1', name: 'Monthly', duration: 30, price: 1500 },
      { id: '2', name: 'Quarterly', duration: 90, price: 4000 },
      { id: '3', name: 'Half Yearly', duration: 180, price: 7500 },
      { id: '4', name: 'Yearly', duration: 365, price: 14000 },
    ]
  });
});

export default router;
