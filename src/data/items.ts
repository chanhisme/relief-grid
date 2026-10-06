import type { ItemDef } from '../types/models';

export const ITEMS: ItemDef[] = [
  { id: 'nuoc', name: 'Nước uống', unit: 'thùng', icon: 'droplets', category: 'Thực phẩm' },
  { id: 'mi', name: 'Mì gói', unit: 'thùng', icon: 'package', category: 'Thực phẩm' },
  { id: 'thuoc', name: 'Thuốc sát khuẩn', unit: 'chai', icon: 'cross', category: 'Y tế' },
  { id: 'chan', name: 'Chăn màn', unit: 'bộ', icon: 'bed', category: 'Chỗ ở' },
  { id: 'sua', name: 'Sữa trẻ em', unit: 'hộp', icon: 'milk', category: 'Trẻ em' },
  { id: 'denpin', name: 'Đèn pin', unit: 'cái', icon: 'flashlight', category: 'Thiết bị' },
  { id: 'vesinh', name: 'Đồ vệ sinh', unit: 'gói', icon: 'sparkles', category: 'Vệ sinh' },
  { id: 'ta', name: 'Tã', unit: 'bịch', icon: 'baby', category: 'Trẻ em' },
];

export const itemById = (id: string): ItemDef =>
  ITEMS.find((i) => i.id === id) ?? { id, name: id, unit: '', icon: 'package', category: '' };
