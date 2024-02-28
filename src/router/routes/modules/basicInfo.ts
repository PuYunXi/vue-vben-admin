import type { AppRouteModule } from '@/router/types';
import { LAYOUT } from '@/router/constant';

const basicInfo: AppRouteModule = {
  path: '/basicInfo',
  name: 'BasicInfo',
  component: LAYOUT,
  meta: {
    orderNo: 30,
    icon: 'ci:main-component',
    title: '测试policy',
    policy: 'BasicInfo',
  },
  children: [
    {
      path: 'customer',
      name: 'customer',
      component: () => import('@/views/sys/about/index.vue'),
      meta: {
        title: '测试policy001',
        icon: 'streamline:information-desk-customer',
        policy: 'BasicInfo.Customer',
      },
    },
    {
      path: 'product',
      name: 'product',
      component: () => import('@/views/sys/about/index.vue'),
      meta: {
        title: '测试policy002',
        icon: 'streamline:production-belt-solid',
        policy: 'BasicInfo.Product',
      },
    },
  ],
};

export default basicInfo;
