<template>
  <BasicModal :width="600" :title="t('routes.admin.userManagement_create_user')" :canFullscreen="false" @ok="submit"
    @cancel="cancel" @register="registerModal" @visible-change="visibleChange" :bodyStyle="{ 'padding-top': '0' }"
    :destroyOnClose="true" :maskClosable="false">
    <div style="padding: 0">

      <Tabs>
        <TabPane :tab="t('routes.admin.userManagement_userInfo')" key="1">
          <BasicForm @register="registerUserForm" />
        </TabPane>
        <TabPane :tab="t('routes.admin.userManagement_role')" key="2">
          <CheckboxGroup v-model:value="defaultRolesRef">
        <a-row justify="center">
          <a-col :span="24">
            <Checkbox style="width: 150px" v-for="(item, index) in itemRolesRef" :key="index" :value="item.name">{{
              item.name }}
            </Checkbox>
          </a-col>
        </a-row>
      </CheckboxGroup>

        </TabPane>
      </Tabs>

    </div>

  </BasicModal>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from "vue";
import { BasicModal, useModalInner } from "@/components/Modal";
import { Tabs ,CheckboxGroup, Checkbox} from "ant-design-vue";
import { BasicForm, useForm } from "@/components/Form/index";
import { createFormSchema, getAllRoleAsync, createUserAsync } from "@/views/admin/users/AbpUser";
import { IdentityRoleDto, IdentityUserCreateDto } from "@/services/ServiceProxies";
import { useI18n } from "@/hooks/web/useI18n";
export default defineComponent({
  name: "CreateAbpUser",
  components: {
    BasicModal,
    Tabs,
    TabPane: Tabs.TabPane,
    BasicForm,
    CheckboxGroup,
    Checkbox
  },
  emits: ["reload", "register"],
  setup(_, { emit }) {
    let itemRoles: IdentityRoleDto[] = [];
    let defaultRoles: string[] = [];
    //选中数组
    let defaultRolesRef = ref(defaultRoles);
    let itemRolesRef = ref(itemRoles);
    const { t } = useI18n();
    const [registerModal, { changeOkLoading, closeModal }] = useModalInner(async()=>{
      itemRolesRef.value.length = 0;
        defaultRolesRef.value.splice(0, defaultRolesRef.value.length);
        let roles = await getAllRoleAsync();
        roles.items?.forEach((e) => {
          itemRolesRef.value.push(e);
        });
    });

    const [registerUserForm, { getFieldsValue, validate, resetFields }] = useForm({
      labelWidth: 120,
      schemas: createFormSchema,
      showActionButtonGroup: false
    });

    async function visibleChange(visible: boolean) {
      if (visible) {
        itemRolesRef.value.length = 0;
        defaultRolesRef.value.splice(0, defaultRolesRef.value.length);
        let roles = await getAllRoleAsync();
        roles.items?.forEach((e) => {
          itemRolesRef.value.push(e);
        });
      } else {
        await resetFields();
        itemRolesRef.value.length = 0;
        defaultRolesRef.value.length = 0;
      }
    };

    // 保存用户
    const submit = async () => {
      try {
        let request = getFieldsValue() as IdentityUserCreateDto;
        request.roleNames = defaultRolesRef.value;
        await createUserAsync({
          request,
          changeOkLoading,
          validate,
          closeModal,
          resetFields
        });
        defaultRolesRef.value.length = 0;
        emit("reload");
      } catch (error) {
        changeOkLoading(false);
      }
    };

    const cancel = () => {
      itemRolesRef.value.length = 0;
      defaultRolesRef.value.length = 0;
      resetFields();
      closeModal();
    };

    return {
      t,
      cancel,
      registerModal,
      registerUserForm,
      submit,
      visibleChange,
      defaultRolesRef,
      itemRolesRef,
      onMounted
    };
  }
});
</script>
<style lang="less" scoped>
.ant-checkbox-wrapper+.ant-checkbox-wrapper {
  margin-left: 0;
}
</style>
