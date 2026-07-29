<template>
    <el-form ref="ruleFormRef" :model="form" label-position="top" class="table-search-form"><!-- 标签显示在输入框上面 -->
      <el-row :gutter="16"><!-- 这一行用来放搜索条件，16 是间距 -->
    <template  v-for="item in formItemArray" :key="item.prop"><!-- 循环渲染每一个搜索项 -->
      <el-col v-bind="item.col"><!-- 这一列的宽度跟着屏幕大小变化 -->
        <el-form-item :label="item.label" :prop="item.prop"><!-- 每一项表单的标题和字段名 -->
        <component v-model="form[item.prop]" :is="isComponent(item.comp)" :placeholder="item.placeholder"><!-- 根据配置决定是输入框还是下拉框 -->
          <template v-if="item.comp === 'select'"><!-- 只有下拉框才会进这里 -->
            <el-option label="Please Select" value=""></el-option><!-- 默认提示选项 -->
            <el-option v-for="option in item.options"
            :key="option.value"
            :label="option.label"
            :value="option.value"
             />
          </template>
        </component>
      </el-form-item>
      </el-col>
    </template>
    </el-row>
    <el-row :gutter="16"><!-- 这一行放按钮 -->
      <el-col v-bind="btnCol"><!-- 按钮这一列在手机上会占满整行 -->
        <div class="search-actions"><!-- 按钮外层盒子 -->
          <el-button type="primary" @click="handleSearch">Search</el-button><!-- 点了就搜索 -->
          <el-button @click="handleReset(ruleFormRef)">Reset</el-button><!-- 点了就重置 -->
        </div>
      </el-col>
    </el-row>
    </el-form>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'

const ruleFormRef = ref(null) // 拿到整个表单实例，后面重置要用

const form = reactive({}) // 这里存表单里输入的值

const props = defineProps({
  formItem: {
    type: Array,
    default: () => []
  }
}) // 父组件把搜索项配置传进来

const emit = defineEmits(['search']) // 这个组件可以往外触发 search 事件

const btnCol = { xs: 24 } // 小屏幕下按钮这一块占满一整行

const formItemArray = computed(() => {
  const {formItem} = props // 从 props 里拿到表单配置
  return formItem.map(item => ({
    ...item, // 把原来的配置先展开
    col: { xs: 24 , sm: 12 , md: 8 , lg: 6 , xl: 6} // 给每个搜索项加上响应式列宽
  }))
}) // 最终给模板里循环使用

const isComponent = (comp) => {
  return {
    input: 'el-input', // 如果是 input 就渲染输入框
    select: 'el-select' // 如果是 select 就渲染下拉框
  }[comp]
} // 根据传进来的 comp 返回对应组件名

const handleSearch = () => {
  emit('search', form) // 把当前表单数据发给父组件
} // 点击搜索按钮执行这里

const handleReset = (ruleFormRef) => {
  if (!ruleFormRef) {
    return
  }
  ruleFormRef.resetFields() // 调用 Element Plus 自带的重置方法
  emit('search', form) // 重置完后把空数据再发给父组件
} // 点击重置按钮执行这里

</script>
<style lang="scss" scoped>
.table-search-form {
  :deep(.el-form-item) {
    margin-bottom: 16px; // 每个表单项下面留一点距离
    display: flex;
  }

  :deep(.el-form-item--label-top .el-form-item__label) {
    text-align: center;
    width: fit-content;
    height: auto;
    margin-bottom: 2px;
    padding-right: 20px;
    line-height: 22px;
    display: flex;
    align-items: center;
  }

  :deep(.el-input),
  :deep(.el-select) {
    width: 80%; // 输入框和下拉框都撑满整列
  }
}

.search-actions {
  display: flex; // 按钮横着排
  gap: 12px; // 按钮之间留 12px 间距
  flex-wrap: wrap; // 空间不够时允许换行
  :deep(.el-button) { margin-left: 0; } // 去掉 Element Plus 按钮默认左边距
}

@media (max-width: 768px) { // 屏幕小于等于 768px 时走这里
  .table-search-form {
    :deep(.el-form-item) {
      display: block;
    }

    :deep(.el-form-item--label-top .el-form-item__label) {
      width: 100%;
      padding-right: 0;
      margin-bottom: 6px;
      justify-content: flex-start;
      text-align: left;
    }

    :deep(.el-form-item__content) {
      width: 100%;
    }

    :deep(.el-input),
    :deep(.el-select) {
      width: 100%;
    }
  }

  .search-actions {
    width: 100%; // 按钮区域撑满整行
  }

  .search-actions :deep(.el-button) {
    flex: 1; // 两个按钮平分宽度
    margin-left: 0; // 小屏幕下也不要默认左边距
  }
}
</style>
