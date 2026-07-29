<template>
  <div>
    <!-- 页面顶部标题组件，单纯显示标题 -->
    <PageHead title="Consultations Record" />
    <!-- 下面这个表格用来展示咨询记录列表 -->
    <el-table :data="tableData" style="width: 100%">
        <!-- 这一列显示用户头像，头像里放的是昵称文字 -->
      <el-table-column label="Session ID" width="100">
        <template #default="scope">
          <!-- scope.row 就是当前这一行的数据 -->
          <el-avatar>{{ scope.row.userNickname }}</el-avatar>
        </template>
      </el-table-column>

        <!-- 这一列显示会话标题和最后一条消息预览 -->
      <el-table-column label="Emotion Log">
        <template #default="scope">
          <!-- 会话标题 -->
          <div class="session-title">{{ scope.row.sessionTitle }}</div>
          <!-- 最后一条消息内容预览 -->
          <div class="session-preview">{{ scope.row.lastMessageContent }}</div>
        </template>
      </el-table-column>

        <!-- 这一列直接显示消息数量 -->
      <el-table-column prop="messageCount" label="Message Count" width="100" />

      <!-- 这一列直接显示最后一条消息时间 -->
      <el-table-column prop="lastMessageTime" label="Last Message Time" width="100" />
      <!-- 操作列：点 detail 按钮会打开详情弹窗 -->
      <el-table-column label="Operation" width="100">
        <template #default="scope">
          <el-button type="primary" text @click="viewSessionDetail(scope.row)">detail</el-button> 
        </template>
        </el-table-column>
        <!-- 表格结束 -->
    </el-table>
      <!-- 分页组件：控制当前页、每页数量、总数 -->
      <el-pagination
      style="margin-top: 25px"
      :current-page="pagination.currentPage"
      :page-size="pagination.size"
      layout="prev, pager, next"
      :total="pagination.total"
      @current-change="handlePageChange"
    />
    <!-- 详情弹窗：点击 detail 后会打开 -->
    <el-dialog
  v-model="showDetailDialog"
  title="Consultation Detail"
  width="70%"
  :close-on-click-modal="false"
>
  <!-- 弹窗里的整体内容区域 -->
  <div class="session-detail">
    <!-- 弹窗头部信息：显示当前会话的基础信息 -->
    <div class="detail-header">
      <div class="detail-row">
        <!-- 用户昵称 -->
        <div class="detail-label">User：</div>
        <div class="detail-value">{{ sessionDetail.userNickname }}</div>
      </div>
      <div class="detail-row">
        <!-- 会话开始时间 -->
        <div class="detail-label">Publish Time：</div>
        <div class="detail-value">{{ sessionDetail.startedAt }}</div>
      </div>
      <div class="detail-row">
        <!-- 当前会话一共有多少条消息 -->
        <div class="detail-label">Message Count：</div>
        <div class="detail-value">{{ sessionDetail.messageCount }}</div>
      </div>
    </div>

    <!-- 消息列表区域 -->
    <div class="messages-container">
      <div class="messages-header">
        <!-- 小标题 -->
        <h4>Consultation Record</h4>
      </div>
      <!-- v-loading=true 时，这一块会显示加载中的遮罩 -->
      <div class="messages-list" v-loading="loadingMessages">
        <div
          v-for="message in sessionMessages"
          :key="message.id"
          :class="['message-item', message.senderType === 1 ? 'user-message' : 'ai-message']"
        >
          <!-- 每条消息的头部：发送者 + 时间 -->
          <div class="message-header">
            <!-- senderType === 1 代表用户，否则代表 AI -->
            <span class="sender">
              {{ message.senderType === 1 ? 'User' : 'Assistant' }}</span>
              <!-- 发送时间 -->
            <span class="time">{{ message.createdAt }}</span>
          </div>
          <!-- 真正的消息内容 -->
          <div class="message-content">
            {{ message.content }}</div>
        </div>
      </div>
    </div>
  </div>
  <!-- 弹窗底部按钮 -->
  <template #footer>
    <!-- 点击后把弹窗关闭 -->
    <el-button type="primary" @click="showDetailDialog = false">Close</el-button>
  </template>
</el-dialog>
  </div>
</template>

<script setup>
// onMounted：页面加载完执行
// ref/reactive：创建响应式数据
import { onMounted, ref, reactive } from 'vue'
// 页面头部标题组件
import PageHead from '@/components/PageHead.vue'
// 这两个接口一个查分页列表，一个查单个会话详情
import { getConsultationPage, getSessionDetail } from '@/api/admin'



// tableData 绑定给表格，表格显示什么，就看这里放什么
const tableData = ref([])

// 分页参数
// currentPage：当前页
// pageSize：每页几条
// total：总条数
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

// sessionDetail：弹窗头部显示的会话基础信息
const sessionDetail = ref({})//咨询会话详情
// sessionMessages：弹窗里一条一条显示的消息记录
const sessionMessages = ref([])//咨询记录列表
// loadingMessages：控制详情区域的加载动画
const loadingMessages = ref(false)//咨询记录列表加载状态

// 点击 detail 按钮后会执行这里
const viewSessionDetail = (row) => {
  // 先让消息列表进入加载状态
  loadingMessages.value = true//咨询记录列表加载状态为true
  // 先把弹窗打开
  showDetailDialog.value = true//显示咨询会话详情弹窗
  // 再根据这一行的 id 去后端拿这次会话的完整消息记录
  getSessionDetail(row.id).then(res => {
    // 数据回来了，关闭加载状态
    loadingMessages.value = false//咨询记录列表加载状态为false
    // 把消息数组塞给弹窗列表
    sessionMessages.value = res//将咨询记录列表赋值给sessionMessages
    // 把当前行的基础信息塞给弹窗头部
    sessionDetail.value = row//将咨询会话详情赋值给sessionDetail
  })
}

// 点击分页器切页时执行这里
const handlePageChange =(pageNum) => {
  // 先改当前页码
  pagination.currentPage = pageNum
  // 再按新的页码重新请求列表
  handleSearch()
}

// 请求咨询记录分页列表
const handleSearch = () => {
  // 把分页参数传给接口
  getConsultationPage(pagination).then(res => {
    // records 是当前页数据，total 是总条数
    const { records, total } = res//获取咨询记录列表和总记录数
    // 表格展示当前页数据
    tableData.value = records//将咨询记录列表赋值给tableData
    // 分页组件需要知道总条数
    pagination.total = total//将总记录数赋值给pagination.total
  })

}

// 控制详情弹窗开关
const showDetailDialog = ref(false)

// 页面一打开就先查一次第一页数据
onMounted(() => {
  handleSearch()
})

</script>

<style scoped lang="scss">
/* 会话标题文字样式 */
.session-title {
    font-weight: 500;
    color: #333;
    margin-bottom: 4px;
  }
  /* 最后一条消息的预览样式，超出两行就省略 */
  .session-preview {
    font-size: 13px;
    color: #666;
    margin-bottom: 4px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  /* 弹窗整体内容区域 */
  .session-detail {
    max-height: 70vh;
    overflow-y: auto;
    /* 详情头部区域 */
    .detail-header {
      margin-bottom: 20px;
      padding: 16px;
      background: #f8f9fa;
      border-radius: 8px;
      border: 1px solid #e9ecef;
    }

    /* 每一行基础信息 */
    .detail-row {
      display: flex;
      align-items: center;
      margin-bottom: 8px;
      /* 最后一行不要底部间距 */
      :last-child {
        margin-bottom: 0;
      }
      /* 左边的标题，比如 User / Publish Time */
      .detail-label {
        font-weight: 500;
        color: #495057;
        min-width: 80px;
        margin-right: 8px;
      }

      /* 右边真正显示的值 */
      .detail-value {
        color: #333;
      }
    }
  }
  /* 消息区域整体 */
  .messages-container {
    margin-top: 20px;
    /* 消息区域标题 */
    .messages-header {
      margin-bottom: 16px;
      h4 {
        margin: 0;
        color: #333;
        font-size: 16px;
        font-weight: 500;
      }
    }
    /* 消息列表滚动区域 */
    .messages-list {
      max-height: 400px;
      overflow-y: auto;
      border: 1px solid #e9ecef;
      border-radius: 8px;
      padding: 16px;
      background: #fff;
      /* 每一条消息卡片 */
      .message-item {
        margin-bottom: 12px;
        padding: 12px;
        border-radius: 8px;
        background: #f8f9fa;
        border: 1px solid #e9ecef;
        /* 最后一条消息不要底部间距 */
        :last-child {
          margin-bottom: 0;
        }
        /* 用户消息的背景色 */
        &.user-message {
          background: #e8f4fd;
        }

        /* AI 消息的背景色 */
        &.ai-message {
          background: #f0f9f0;
        }
      }
      /* 消息头部：发送者和时间左右分开 */
      .message-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
        /* 发送者名字 */
        .sender {
          font-weight: 500;
          color: #333;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        /* 消息时间 */
        .time {
          font-size: 12px;
          color: #999;
        }

        /* 消息正文 */
        .message-content {
          color: #333;
          line-height: 1.6;
          white-space: pre-wrap;
          margin-top: 8px;
          font-size: 14px;
        }
      }
    }
  }
</style>
