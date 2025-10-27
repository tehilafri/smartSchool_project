import { useDispatch, useSelector } from 'react-redux';

// Typed hooks for better TypeScript support and convenience
export const useAppDispatch = () => useDispatch();
export const useAppSelector = useSelector;