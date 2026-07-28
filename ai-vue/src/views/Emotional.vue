<template>
  <div>
    <PageHead title="Emotional Diary" style="margin-bottom: 25px;" />
    <TableSearch :formItem="formItem" @search="handleSearch" />
    <el-table :data="tableData" style="width: 100%">
      <el-table-column prop="id" label="User ID" width="80" />
      <el-table-column label="Session ID" width="150">
        <template #default="scope">
          <el-avatar>{{ scope.row.nickname }}</el-avatar>
        </template>
      </el-table-column>
      <el-table-column prop="diaryDate" label="Record Date" width="120" />
      <el-table-column label="Mood Score">
        <template #default="scope">
          <el-rate :model-value="scope.row.moodScore" :max="10" />
        </template>
      </el-table-column>
      <el-table-column label="Life Metrics" width="200">
        <template #default="scope">
          <div>
            <p>SleepQuality：{{ scope.row.sleepQuality }} / 5</p>
            <p>ressLevel：{{ scope.row.stressLevel }} / 5</p>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="emotionTriggers" label="Emotion Triggers" width="200" />
      <el-table-column prop="diaryContent" label="Content of Diary" width="250" />
      <el-table-column label="Operation" width="240">
        <template #default="scope">
          <el-button text type="danger" @click="handleDelete(scope.row)">Delete</el-button>
        </template>
      </el-table-column>
    </el-table>
      <!-- 分页组件：当前页、每页条数、总条数都从 pagination 里拿 -->
    <el-pagination
      style="margin-top: 25px"
      :current-page="pagination.currentPage"
      :page-size="pagination.size"
      layout="prev, pager, next"
      :total="pagination.total"
      @current-change="handlePageChange"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import PageHead from '@/components/PageHead.vue'
import TableSearch from '@/components/TableSearch.vue'
import { getEmotionalPage, deleteEmotional } from '@/api/admin'
import { ElMessageBox } from 'element-plus'

const formItem = [
  { comp: 'input', prop: 'userId', label: 'User ID', placeholder: '请输入User ID' },
  {
    comp: 'select',
    prop: 'moodScoreRange',
    label: 'Mood Score',
    placeholder: 'Select Mood Score Range',
    options: [
      { label: 'Low(1-3)', value: '1-3' },
      { label: 'Medium(4-6)', value: '4-6' },
      { label: 'High(7-10)', value: '7-10' }
    ]
  }
]

// 列表
const tableData = ref([])
// 分页参数
const pagination = reactive({
  current: 1,
  size: 10,
  total: 0
})


// 点分页组件时会走这里，page 就是你点的页码
const handlePageChange = (page) => {
  pagination.current = page // 先把当前页改掉
  handleSearch() // 再重新查这一页的数据
}

const handleSearch = async (formData) => {
  const params = {
    ...pagination,
    ...formData
  }
  const { records, total } = await getEmotionalPage(params) 
  tableData.value = records
  pagination.total = total
}

// 删除
const handleDelete = (row) => {
  ElMessageBox.confirm('确定删除该条记录吗？', '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'danger'
  }).then(() => {
    // 确认删除
    deleteEmotional(row.id).then(() => {
      handleSearch()
    })
  }).catch(() => {})
}

onMounted(() => {
  handleSearch({})
})
</script>

<style scoped lang="scss">
:deep(.el-table .cell) {
  text-align: center;
}
</style>