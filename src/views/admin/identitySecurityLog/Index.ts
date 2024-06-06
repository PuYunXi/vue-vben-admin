import { FormSchema } from '@/components/Table';
import { BasicColumn } from '@/components/Table';
import { useI18n } from '@/hooks/web/useI18n';
import { formatToDateTime, dateUtil } from '@/utils/dateUtil';
const { t } = useI18n();
import {
  IdentitySecurityLogsServiceProxy,
  PageIdentitySecurityLogInput,
} from '@/services/ServiceProxies';

// 分页表格登录日志 BasicColumn
export const tableColumns: BasicColumn[] = [
  {
    title: t('routes.admin.identitySecurityLog_ApplicationName'),
    dataIndex: 'applicationName',
  },
  {
    title: t('routes.admin.identitySecurityLog_Identity'),
    dataIndex: 'identity',
  },
  {
    title: t('routes.admin.identitySecurityLog_Action'),
    dataIndex: 'action',
  },
  {
    title: t('routes.admin.identitySecurityLog_UserName'),
    dataIndex: 'userName',
  },
  {
    title: t('routes.admin.identitySecurityLog_CorrelationId'),
    dataIndex: 'correlationId',
  },
  {
    title: t('routes.admin.identitySecurityLog_ClientIpAddress'),
    dataIndex: 'clientIpAddress',
  },
  {
    title: t('routes.admin.identitySecurityLog_CreationTime'),
    dataIndex: 'creationTime',
    customRender: ({ text }) => {
      return formatToDateTime(text);
    },
  },
];

// 分页查询登录日志 FormSchema
export const searchFormSchema: FormSchema[] = [
  {
    field: 'time',
    component: 'RangePicker',
    label: t('routes.admin.audit_executeTime'),
    colProps: {
      offset: 1,
      span: 5
    },
    componentProps: {
      format: 'YYYY-MM-DD HH:mm:ss',
      placeholder: ['开始时间', '结束时间'],
      showTime: { format: 'HH:mm:ss' },
    },
    defaultValue: [dateUtil().subtract(1, 'days'), dateUtil().add(1, 'days')],
  },
  {
    field: 'userName',
    label: t('routes.admin.identitySecurityLog_UserName'),
    component: 'Input',
    colProps: {
      offset: 1,
      span: 5
    },
  },
  {
    field: 'correlationId',
    label: 'CorrelationId',
    labelWidth: 95,
    component: 'Input',
    colProps: {
      offset: 1,
      span: 5
    },
  }
];


/**
 * 分页查询登录日志
 */
export async function pageAsync(params: PageIdentitySecurityLogInput,
) {
  const identitySecurityLogServiceProxy = new IdentitySecurityLogsServiceProxy();
  return identitySecurityLogServiceProxy.page(params);
}