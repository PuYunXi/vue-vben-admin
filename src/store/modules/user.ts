import type { UserInfo } from '#/store';
import type { ErrorMessageMode } from '#/axios';
import { defineStore } from 'pinia';
import { store } from '@/store';
import { RoleEnum } from '@/enums/roleEnum';
import { PageEnum } from '@/enums/pageEnum';
import {
  ROLES_KEY,
  TOKEN_KEY,
  USER_INFO_KEY,
  ABP_LOCALE_KEY,
  ABP_TETANT_KEY,
} from '@/enums/cacheEnum';
import { getAuthCache, setAuthCache } from '@/utils/auth';
import { GetUserInfoModel, LoginParams } from '@/api/sys/model/userModel';
import { doLogout, getUserInfo, login, getAbpApplicationConfiguration } from '@/api/sys/user';
import { useI18n } from '@/hooks/web/useI18n';
import { useMessage } from '@/hooks/web/useMessage';
import { router } from '@/router';
import { usePermissionStore } from '@/store/modules/permission';
import { RouteRecordRaw } from 'vue-router';
import { PAGE_NOT_FOUND_ROUTE } from '@/router/routes/basic';
import { isArray } from '@/utils/is';
import { h } from 'vue';
import { jwtDecode } from 'jwt-decode';
import { LoginInput } from '@/services/ServiceProxies';
import { useOidcLogout } from '@/views/sys/login/useLogin';
interface UserState {
  userInfo: Nullable<UserInfo>;
  token?: string;
  id_token?: string;
  roleList: RoleEnum[];
  sessionTimeout?: boolean;
  lastUpdateTime: number;
  language: string;
  tenantId: string;
}

export const useUserStore = defineStore({
  id: 'app-user',
  state: (): UserState => ({
    // user info
    userInfo: null,
    // token
    token: undefined,
    id_token: undefined,
    // roleList
    roleList: [],
    // Whether the login expired
    sessionTimeout: false,
    // Last fetch time
    lastUpdateTime: 0,
    language: '',
    tenantId: '',
  }),
  getters: {
    getUserInfo(state): UserInfo {
      return state.userInfo || getAuthCache<UserInfo>(USER_INFO_KEY) || {};
    },
    getToken(state): string {
      return state.token || getAuthCache<string>(TOKEN_KEY);
    },
    getRoleList(state): RoleEnum[] {
      return state.roleList.length > 0 ? state.roleList : getAuthCache<RoleEnum[]>(ROLES_KEY);
    },
    getSessionTimeout(state): boolean {
      return !!state.sessionTimeout;
    },
    getLastUpdateTime(state): number {
      return state.lastUpdateTime;
    },
    getLanguage(): string {
      return this.language || getAuthCache<string>(ABP_LOCALE_KEY);
    },
    getTenant(): string {
      return this.tenantId || getAuthCache<string>(ABP_TETANT_KEY);
    },
    checkUserLoginExpire(): boolean {
      try {
        const userStore = useUserStoreWithOut();
        const token = userStore.getToken;
        if (!token) return true;
        const decoded: any = jwtDecode(token);
        // 获取当前时间戳
        const currentTimeStamp = new Date().getTime() / 1000;
        if (currentTimeStamp >= decoded.exp) {
          return true;
        } else {
          return false;
        }
      } catch (error) {
        return true;
      }
    },
  },
  actions: {
    setToken(info: string | undefined) {
      this.token = info ? info : ''; // for null or undefined value
      setAuthCache(TOKEN_KEY, info);
    },
    setRoleList(roleList: RoleEnum[]) {
      this.roleList = roleList;
      setAuthCache(ROLES_KEY, roleList);
    },
    setUserInfo(info: UserInfo | null) {
      this.userInfo = info;
      this.lastUpdateTime = new Date().getTime();
      setAuthCache(USER_INFO_KEY, info);
    },
    setSessionTimeout(flag: boolean) {
      this.sessionTimeout = flag;
    },
    resetState() {
      this.userInfo = null;
      this.token = '';
      this.roleList = [];
      this.sessionTimeout = false;
    },
    /**
     * @description: login
     */
    async login(
      params: LoginParams & {
        goHome?: boolean;
        mode?: ErrorMessageMode;
      },
    ) {
      try {
        const { goHome = true } = params;
        const request = new LoginInput();
        request.name = params.username;
        request.password = params.password;
        const data = await login(request);
        this.setToken(data.token as string);
        this.setUserInfo({
          userId: data.id as string,
          username: data.userName as string,
          realName: data.name as string,
          roles: data.roles as [],
          avatar: '',
          isSts: false,
          idToken: '',
        });

        await this.getAbpApplicationConfigurationAsync();
        goHome && (await router.replace(PageEnum.BASE_HOME));
        return null;
      } catch (error) {
        router.replace(PageEnum.BASE_LOGIN);
        return null;
      }
    },
    async getAbpApplicationConfigurationAsync() {
      const application = await getAbpApplicationConfiguration();
      const permissionStore = usePermissionStore();

      const grantPolicy = Object.keys(application.auth?.grantedPolicies as object);
      if (grantPolicy.length == 0) {
        router.replace(PageEnum.BASE_LOGIN);
        return;
      }
      permissionStore.setPermCodeList(grantPolicy);
    },
 
 
    /**
     * @description: logout
     */
    async logout(goLogin = false) {
      try {
        debugger;
        if (this.userInfo?.isSts) {
          await useOidcLogout();
        } else {
          this.resetState();
          goLogin && router.push(PageEnum.BASE_LOGIN);
        }
      } catch (ex) {
        console.log(ex);
      }
    },

    /**
     * @description: Confirm before logging out
     */
    confirmLoginOut() {
      const { createConfirm } = useMessage();
      const { t } = useI18n();
      createConfirm({
        iconType: 'warning',
        title: () => h('span', t('sys.app.logoutTip')),
        content: () => h('span', t('sys.app.logoutMessage')),
        onOk: async () => {
          // 主动登出，不带redirect地址
          await this.logout(true);
        },
      });
    },
  },
});

// Need to be used outside the setup
export function useUserStoreWithOut() {
  return useUserStore(store);
}
