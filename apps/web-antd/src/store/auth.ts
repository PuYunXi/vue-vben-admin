import type { LoginAndRegisterParams } from '@vben/common-ui';
import type { UserInfo } from '@vben/types';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { DEFAULT_HOME_PATH, LOGIN_PATH } from '@vben/constants';
import { resetAllStores, useAccessStore, useUserStore } from '@vben/stores';

import { notification } from 'ant-design-vue';
import { defineStore } from 'pinia';

import { getAccessCodes, getUserInfo, login, loginAbp } from '#/api';
import { $t } from '#/locales';

import {
  AccountServiceProxy,
  LoginOutput,
  LoginInput,
  AbpApplicationConfigurationServiceProxy,
} from '../services/ServiceProxies';


export const useAuthStore = defineStore('auth', () => {
  const accessStore = useAccessStore();
  const userStore = useUserStore();
  const router = useRouter();

  const loginLoading = ref(false);

  /**
   * 异步处理登录操作
   * Asynchronously handle the login process
   * @param params 登录表单数据
   */
  async function authLogin(
    params: LoginAndRegisterParams,
    onSuccess?: () => Promise<void> | void,
  ) {

    console.log("authLogin");

    // 异步处理用户登录操作并获取 accessToken
    let userInfo: null | UserInfo = null;
    try {
      loginLoading.value = true;
      const { accessToken, refreshToken } = await login(params);

      // 如果成功获取到 accessToken
      if (accessToken) {
        // 将 accessToken 存储到 accessStore 中
        accessStore.setAccessToken(accessToken);
        accessStore.setRefreshToken(refreshToken);

        // 获取用户信息并存储到 accessStore 中
        const [fetchUserInfoResult, accessCodes] = await Promise.all([
          fetchUserInfo(),
          getAccessCodes(),
        ]);

        userInfo = fetchUserInfoResult;

        userStore.setUserInfo(userInfo);
        accessStore.setAccessCodes(accessCodes);

        if (accessStore.loginExpired) {
          accessStore.setLoginExpired(false);
        } else {
          onSuccess
            ? await onSuccess?.()
            : await router.push(userInfo.homePath || DEFAULT_HOME_PATH);
        }

        if (userInfo?.realName) {
          notification.success({
            description: `${$t('authentication.loginSuccessDesc')}:${userInfo?.realName}`,
            duration: 3,
            message: $t('authentication.loginSuccess'),
          });
        }
      }
    } finally {
      loginLoading.value = false;
    }

    return {
      userInfo,
    };
  }
 
  async function abpLogin(params: LoginAndRegisterParams, onSuccess?: () => Promise<void> | void) {
    try {
      loginLoading.value = true;
      console.log("abpLogin");
      const input = new LoginInput();
      input.name = params.username;
      input.password = params.password;
      let loginRes = await loginAbp(input);
      console.log("loginRes:", loginRes);
      const userInfo: null | UserInfo = {
        userId: loginRes.id as string,
        username: loginRes.userName as string,
        realName: loginRes.name as string,
        homePath: DEFAULT_HOME_PATH,
        roles: loginRes.roles,
        desc: '',
        avatar: '',
        token: loginRes.token as string,
      };

      userStore.setUserInfo(userInfo);

      onSuccess
        ? await onSuccess?.()
        : await router.push(DEFAULT_HOME_PATH);
      if (userInfo?.realName) {
        notification.success({
          description: `${$t('authentication.loginSuccessDesc')}:${userInfo?.realName}`,
          duration: 3,
          message: $t('authentication.loginSuccess'),
        });
      }

    } finally {
      loginLoading.value = false;
    }
  }
 
  async function logout() {
    resetAllStores();
    accessStore.setLoginExpired(false);

    // 回登陆页带上当前路由地址
    await router.replace({
      path: LOGIN_PATH,
      query: {
        redirect: encodeURIComponent(router.currentRoute.value.fullPath),
      },
    });
  }

  async function fetchUserInfo() {
    let userInfo: null | UserInfo = null;
    userInfo = await getUserInfo();
    userStore.setUserInfo(userInfo);
    return userInfo;
  }

  function $reset() {
    loginLoading.value = false;
  }

  return {
    $reset,
    authLogin,
    fetchUserInfo,
    loginLoading,
    logout,
    abpLogin
  };
});
