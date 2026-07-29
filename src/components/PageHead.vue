<!-- 页面头部组件：标题 + 右侧操作按钮 -->
<template>
  <div class="pagehead">
      <p class="page-title">{{ props.title }}</p>
      <!-- 按钮插槽：父组件通过 #buttons 传入操作按钮 -->
      <div class="action-btn">
        <slot name="buttons"></slot>
      </div>
  </div>
</template>

<script setup>
 const props = defineProps({
  title: {
    type: String,
    default: 'Knowledge Article'
  }
})
</script>

<style lang="scss" scoped>
/* 大屏：标题和按钮左右分布 */
.pagehead {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;        /* 空间不够时允许换行 */

  .page-title {
    margin-bottom: 0;
    font-size: 20px;
    color: #2d3748;

  }
  /* 操作按钮区域：横排 + 间距 + 允许换行 */
  .action-btn {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;

    /* 去掉 Element Plus 按钮默认的 margin-left，用 gap 统一控制间距 */
    :deep(.el-button) {
      margin-left: 0;
    }
  }
}

/* 小屏幕（≤768px）：标题和按钮改为上下布局 */
@media (max-width: 768px) {
  .pagehead {
    align-items: flex-start;
    flex-direction: column;
  }
  .action-btn {
    width: 100%;
  }
}
</style>
