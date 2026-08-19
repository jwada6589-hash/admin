import { Routes, Route } from 'react-router-dom';
import OrdersList from './OrdersList';
import OrderDetail from './OrderDetail';
import { Order, OrderStatus } from './types';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useAdmin } from '../../shared/context/AdminContext';

export default function OrdersView() {
  const { tokenHash } = useAdmin();
  const orders = (useQuery(api.orders.adminList, { adminTokenHash: tokenHash }) ?? []) as Order[];
  const updateStatus = useMutation(api.orders.updateStatus);
  const deleteOrder = useMutation(api.orders.deleteOrder);

  const handleUpdateStatus = async (orderId: string, status: OrderStatus, rejectReason?: string) => {
    await updateStatus({ adminTokenHash: tokenHash, orderId: orderId as any, status, rejectionReason: rejectReason });
  };

  const handleDeleteOrder = async (orderId: string) => {
    await deleteOrder({ adminTokenHash: tokenHash, orderId: orderId as any });
  };

  return (
    <div className="h-full animate-in fade-in duration-300">
      <Routes>
        <Route path="/" element={<OrdersList orders={orders} onDeleteOrder={handleDeleteOrder} />} />
        <Route path="/:orderId" element={<OrderDetail orders={orders} onUpdateStatus={handleUpdateStatus} />} />
      </Routes>
    </div>
  );
}
