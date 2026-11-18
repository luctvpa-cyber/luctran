import type { SubsystemType } from '../types/maintenance';

export type DepotSceneCategory = 'overview' | 'facilities' | 'night';

export interface DepotScene {
  id: string;
  src: string;
  title: string;
  subtitle: string;
  category: DepotSceneCategory;
}

export const DEPOT_SCENES: DepotScene[] = [
  {
    id: 'night-gate',
    src: '/assets/aistudio/IMG_3584_a2066728.JPG',
    title: 'Cổng chính Kho Cam Ranh (Ban đêm)',
    subtitle: 'Biển hiệu Công ty Cổ phần Nhiên liệu bay Petrolimex · Chi nhánh Cam Ranh',
    category: 'night',
  },
  {
    id: 'day-office',
    src: '/assets/aistudio/IMG_3588_d85c8adb.JPG',
    title: 'Nhà điều hành Chi nhánh Cam Ranh',
    subtitle: 'Mặt tiền khu văn phòng điều hành và cổng chính ban ngày',
    category: 'facilities',
  },
  {
    id: 'day-tanks',
    src: '/assets/aistudio/IMG_3585_c1eb012b.JPG',
    title: 'Cụm bồn chứa Jet A-1 (CXR-01 → CXR-04)',
    subtitle: 'Khu vực bồn trụ đứng & bồn ngang phục vụ tra nạp hàng không',
    category: 'facilities',
  },
  {
    id: 'day-overview-front',
    src: '/assets/aistudio/IMG_3581_0d332e00.JPG',
    title: 'Toàn cảnh Kho Cam Ranh (Ban ngày)',
    subtitle: 'Góc nhìn tổng thể khu văn phòng, bồn chứa và tuyến xe tra nạp',
    category: 'overview',
  },
  {
    id: 'night-overview-yard',
    src: '/assets/aistudio/IMG_3587_8d908205.JPG',
    title: 'Toàn cảnh chiếu sáng vận hành đêm',
    subtitle: 'Hệ thống đèn pha cao áp & hạ tầng kỹ thuật điện ban đêm',
    category: 'night',
  },
  {
    id: 'day-pump-gantry',
    src: '/assets/aistudio/IMG_3594_e22473f3.JPG',
    title: 'Cụm giàn xuất & Trạm bơm lọc',
    subtitle: 'Khu vực thiết bị bơm, bầu lọc tách nước và bể PCCC',
    category: 'facilities',
  },
  {
    id: 'day-loading-truck',
    src: '/assets/aistudio/IMG_3593_7994441d.JPG',
    title: 'Bến xuất nhiên liệu & Xe xi-téc',
    subtitle: 'Hoạt động tiếp nhận, khớp nối ống mềm và xuất nhiên liệu',
    category: 'facilities',
  },
  {
    id: 'day-pccc',
    src: '/assets/aistudio/IMG_3586_10613174.JPG',
    title: 'Bể nước PCCC & Khu phụ trợ',
    subtitle: 'Hạ tầng phòng cháy chữa cháy và trạm trực vận hành',
    category: 'facilities',
  },
  {
    id: 'day-canopy',
    src: '/assets/aistudio/IMG_3589_9972ae3f.JPG',
    title: 'Mái che giàn xuất Petrolimex',
    subtitle: 'Khu vực xuất nhiên liệu trung tâm và hành lang bảo vệ',
    category: 'facilities',
  },
  {
    id: 'day-aerial-east',
    src: '/assets/aistudio/IMG_3573_4bf3f2ea.JPG',
    title: 'Phối cảnh tổng thể từ trên cao (Hướng Đông)',
    subtitle: 'Mặt bằng toàn khu kho và tuyến đường dẫn vào Cảng HKQT Cam Ranh',
    category: 'overview',
  },
  {
    id: 'day-aerial-tanks',
    src: '/assets/aistudio/IMG_3576_c08522b3.JPG',
    title: 'Phối cảnh cụm bồn từ trên cao',
    subtitle: 'Đê ngăn cháy và 3 bồn trụ đứng Jet A-1 nhìn từ trên cao',
    category: 'overview',
  },
  {
    id: 'day-aerial-west',
    src: '/assets/aistudio/IMG_3578_c7a564c3.JPG',
    title: 'Phối cảnh toàn khu (Góc Tây Bắc)',
    subtitle: 'Bố trí giao thông nội bộ và phân khu kỹ thuật kho',
    category: 'overview',
  },
  {
    id: 'day-aerial-corridor',
    src: '/assets/aistudio/IMG_3580_ba6de620.JPG',
    title: 'Toàn cảnh kho & hành lang kỹ thuật',
    subtitle: 'Góc nhìn bao quát toàn bộ khuôn viên Chi nhánh Cam Ranh',
    category: 'overview',
  },
  {
    id: 'day-aerial-north',
    src: '/assets/aistudio/IMG_3577_40691864.JPG',
    title: 'Phối cảnh hành lang tuyến ống',
    subtitle: 'Khu vực đường ống dẫn và bãi đỗ phương tiện kỹ thuật',
    category: 'overview',
  },
  {
    id: 'day-office-wide',
    src: '/assets/aistudio/IMG_3579_a0119400.JPG',
    title: 'Khu điều hành & Hàng rào mặt tiền',
    subtitle: 'Kiến trúc khu nhà làm việc chính Petrolimex Aviation',
    category: 'facilities',
  },
  {
    id: 'day-corridor-bay',
    src: '/assets/aistudio/IMG_3590_9e6d701b.JPG',
    title: 'Nhà mái che phương tiện & tuyến ống',
    subtitle: 'Kết cấu khung thép mái vòm khu vực bảo trì phương tiện',
    category: 'facilities',
  },
  {
    id: 'day-street-view',
    src: '/assets/aistudio/IMG_3591_a85f8733.JPG',
    title: 'Góc nhìn từ trục đường chính',
    subtitle: 'Tổ hợp nhà điều hành, trạm bảo vệ và cụm bồn phía sau',
    category: 'facilities',
  },
  {
    id: 'night-aerial-front',
    src: '/assets/aistudio/IMG_3583_424d11d0.JPG',
    title: 'Toàn cảnh ban đêm (Hướng chính)',
    subtitle: 'Ánh sáng vận hành toàn bộ nhà điều hành và khu bồn chứa',
    category: 'night',
  },
  {
    id: 'night-aerial-east',
    src: '/assets/aistudio/IMG_3575_b6d688b8.JPG',
    title: 'Khu bồn chứa ban đêm từ trên cao',
    subtitle: 'Hệ thống chiếu sáng khu đê ngăn cháy và bến xuất',
    category: 'night',
  },
  {
    id: 'night-aerial-west',
    src: '/assets/aistudio/IMG_3592_08904f5e.JPG',
    title: 'Phối cảnh cụm bồn đêm (Góc Tây)',
    subtitle: 'Tổng thể 3 bồn lớn và xe tra nạp vận hành ban đêm',
    category: 'night',
  },
  {
    id: 'night-aerial-corridor',
    src: '/assets/aistudio/IMG_3582_9cd58087.JPG',
    title: 'Hành lang kỹ thuật ban đêm',
    subtitle: 'Góc nhìn bao quát khuôn viên và tuyến nhà xe dài ban đêm',
    category: 'night',
  },
  {
    id: 'night-aerial-far',
    src: '/assets/aistudio/IMG_3574_f9e08099.JPG',
    title: 'Toàn khu kho từ trên cao (Ban đêm)',
    subtitle: 'Hệ thống đèn chiếu sáng dọc tuyến ống và khu vực kho chính',
    category: 'night',
  },
];

export const AUTH_BACKDROP_SCENES: DepotScene[] = [
  DEPOT_SCENES[0], // night-gate
  DEPOT_SCENES[4], // night-overview-yard
  DEPOT_SCENES[1], // day-office
  DEPOT_SCENES[2], // day-tanks
];

export const HERO_FEATURED_SCENES: DepotScene[] = [
  DEPOT_SCENES[3], // day-overview-front
  DEPOT_SCENES[2], // day-tanks
  DEPOT_SCENES[0], // night-gate
  DEPOT_SCENES[1], // day-office
  DEPOT_SCENES[5], // day-pump-gantry
  DEPOT_SCENES[4], // night-overview-yard
];

export const SUBSYSTEM_BANNER_SCENES: Record<SubsystemType | 'custom', DepotScene> = {
  tanks: DEPOT_SCENES[2], // IMG_3585_c1eb012b (CXR-01..04)
  filters: DEPOT_SCENES[5], // IMG_3594_e22473f3 (pump house & gantry)
  hoses: DEPOT_SCENES[6], // IMG_3593_7994441d (loading rack & truck)
  electrics: DEPOT_SCENES[4], // IMG_3587_8d908205 (night lighting)
  custom: DEPOT_SCENES[9], // IMG_3573_4bf3f2ea (aerial depot)
};
