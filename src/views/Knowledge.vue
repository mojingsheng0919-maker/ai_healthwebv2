<template>
  <div>
    <!-- 页面头部区域，里面放标题和右上角按钮 -->
    <PageHead style="margin-bottom: 25px;">
      <template #buttons>
        <!-- 传一个空对象进去，表示不是编辑旧文章，而是新增文章 -->
        <el-button type="primary" @click="handleEdit({})">Edit</el-button>
      </template>
    </PageHead>
    <!-- 搜索表单组件：把表单配置传进去，点搜索时会触发 handleSearch -->
    <TableSearch :formItem="formItem" @search="handleSearch" />
    <!-- 文章列表表格：tableData 里放什么，这里就显示什么 -->
    <el-table :data="tableData" style="width: 100%" margin-top="25px">
      <!-- 第一列：文章标题 -->
      <el-table-column label="Article Name" >
        <template #default="scope">
          <!-- scope.row 就是这一行的数据 -->
          <div style="display: flex; align-items: center;">
            <el-icon><Timer /></el-icon>
            <span>{{scope.row.title}}</span>
          </div>
        </template>
      </el-table-column>
      <!-- 第二列：文章分类，这里是拿 categoryId 去分类映射表里找中文名 -->
      <el-table-column label="classify" width="200" >
        <template #default="scope">
          <div style="display: flex; align-items: center;">
            <el-icon><Timer /></el-icon>
            <span>{{categoryMap[scope.row.categoryId]}}</span>
          </div>
        </template>
      </el-table-column>
      <!-- 下面这几列是直接显示后端返回的字段 -->
      <el-table-column prop = 'authorName' label="Author" width="150" />
      <el-table-column prop = 'readCount' label="readVolume" width="150" />
      <el-table-column prop = 'updatedAt' label="publishTime" width="150" />
      <!-- 最后一列：操作按钮 -->
      <el-table-column label="Operation" width="250" fixed="right">
        <template #default="scope">
          <!-- 编辑当前这一行文章 -->
          <el-button text type="primary" @click="handleEdit(scope.row)">Edit</el-button>
          <!-- 状态是草稿 0 或已下线 2 时，才显示发布按钮 -->
          <el-button @click="handlePublish(scope.row)" v-if="scope.row.status === 0 || scope.row.status === 2" text type="success">publish</el-button>
          <!-- 状态是已发布 1 时，才显示下线按钮 -->
          <el-button @click="handleUnpublish(scope.row)" v-if="scope.row.status === 1" text type="warning">offline</el-button>
          <!-- 删除当前这一行文章 -->
          <el-button @click="handleDelete(scope.row)" text type="danger">Delete</el-button>
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
    <!-- 文章弹窗：新增和编辑都用它，categories 给下拉框，article 给编辑回填 -->
    <ArticleDialog v-model:modelValue="dialogVisible" :categories="categories"  @success="handleSuccess" :article="currentArticle"/>
  </div>
</template>
<script setup>
import { onMounted , ref, reactive } from 'vue' // onMounted：页面加载完执行；ref/reactive：做响应式数据
import PageHead from '@/components/PageHead.vue' // 页面头部组件
import TableSearch from '@/components/TableSearch.vue' // 通用搜索组件
import { categoryTree , articleList ,getArticleDetail ,deleteArticle ,changeArticleStatus } from '@/api/admin' // 文章相关接口
import ArticleDialog from '@/components/ArticleDialog.vue' // 新增/编辑文章弹窗
import { ElMessageBox, ElMessage } from 'element-plus'// ElMessageBox 是确认弹窗，ElMessage 是轻提示



// 搜索表单配置数组
// 这里不是直接写死 HTML，而是把“每一项长什么样”告诉 TableSearch 组件
const formItem = [
  {comp:'input',prop:'title',label:'Article Name',placeholder:'Please Enter Article Name'}, // 第一项：文章标题输入框
  {comp:'select',prop:'category',label:'Category',placeholder:'Please Select Category'}, // 第二项：分类下拉框，选项后面动态塞进去
  {comp:'select',prop:'status',label:'Status',placeholder:'Please Enter content of article' , // 第三项：状态下拉框
  options:[ // 这里是状态的固定选项
    {
      label:'Draft',value:'0' // 草稿
    },
    {
      label:'Published',value:'1' // 已发布
    }
    ,
    {
      label:'Offline',value:'2' // 已下线
    }
   ] }
]

// 分页参数
// currentPage：当前在第几页
// size：每页显示多少条
// total：总共有多少条
const pagination = reactive({
  currentPage: 1, // 当前页码
  size: 10, // 每页显示条数
  total: 0 // 总条数
})

// searchForm 用来记住当前搜索条件
// 这样你翻页的时候，还能继续带着原来的筛选条件去查，不会丢
const searchForm = reactive({})
// dialogVisible 控制弹窗开关，true 显示，false 关闭
const dialogVisible = ref(false)

// 点击搜索按钮后会走这里
// formData 就是 TableSearch 组件收集好的搜索条件
 const handleSearch = async (formData = searchForm) => {
  Object.assign(searchForm, formData) // 把这次搜索条件保存起来，后面翻页继续用

  const params = {
    ...pagination, // 分页参数一起带给后端
    ...searchForm // 搜索条件一起带给后端
  }

  const {records ,total} = await articleList(params) // 调接口获取文章分页数据
  tableData.value = records // 把文章列表塞给表格
  pagination.total = total // 更新总条数，让分页组件知道一共多少条
}

// 点分页组件时会走这里，page 就是你点的页码
const handlePageChange = (page) => {
  pagination.currentPage = page // 先把当前页改掉
  handleSearch() // 再重新查这一页的数据
}



// categoryMap 是一个“分类id -> 分类名”的映射表
// 这样表格里只拿到 categoryId 时，也能显示人能看懂的分类名
const categoryMap = reactive({})
// categories 给弹窗和搜索下拉框用，格式是 { label, value }
const categories = ref([])
// tableData 是表格真正显示的数据
const tableData = ref([])
// currentArticle 存当前正在编辑的文章详情
const currentArticle = ref(null)
// 弹窗提交成功后的回调
const handleSuccess = () => {
  dialogVisible.value = false // 先把弹窗关掉
  currentArticle.value = null // 清空当前编辑文章，避免下次串数据
  handleSearch() // 重新查一次列表，让最新数据显示出来
}

// 点击“新增”或“编辑”按钮都会走这里
// row 是当前点击的文章对象
const handleEdit = async (row) => {
  if (!row.id) {
    currentArticle.value = null // 没有 id，说明是新增，不是编辑旧文章
    dialogVisible.value = true // 打开弹窗
} else {
    // 有 id，说明是编辑旧文章，先去后端查详情再打开弹窗
    getArticleDetail(row.id).then(res => {
    currentArticle.value = res // 把详情塞给弹窗做回填
    dialogVisible.value = true // 再打开弹窗
  })
}
}

// 发布文章
const handlePublish = (row) => {
  ElMessageBox.confirm(
    `确认发布文章${row.title}吗？`, // 弹窗正文
    '确认', // 弹窗标题
    {
      confirmButtonText: '确认发布',
      cancelButtonText: '取消',
      type: 'info'
    }
  ).then(() => {
    changeArticleStatus(row.id, { status: 1 }).then(res => {
      ElMessage.success('发布成功') // 提示发布成功
      handleSearch() // 刷新列表
    })
  })
}

// 下线文章
const handleUnpublish = (row) => {
  ElMessageBox.confirm(
    `确认下线文章${row.title}吗？`,
    '确认',
    {
      confirmButtonText: '确认下线',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    changeArticleStatus(row.id, { status: 2 }).then(res => {
      ElMessage.success('下线成功') // 提示下线成功
      handleSearch() // 刷新列表
    })
  })
}


// 删除文章
const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确认删除文章${row.title}吗？`,
    '确认',
    {
      confirmButtonText: '确认删除',
      cancelButtonText: '取消',
      type: 'danger'
    }
  ).then(() => {
    deleteArticle(row.id).then(res => {
      ElMessage.success('删除成功') // 提示删除成功
      handleSearch() // 刷新列表
    })
  })
}




// 页面一进来就执行这里
// 先查分类，再查文章列表
onMounted(async () => {
  const data = await categoryTree() // 调接口拿分类列表

  categories.value = data.map(item => { // 把后端分类数据转成下拉框能直接用的格式
    categoryMap[item.id] = item.categoryName // 顺手做一个 id -> 分类名 的映射表
    return {
      label: item.categoryName, // 下拉框显示的文字
      value: item.id // 下拉框提交的值
    }
  })
  formItem[1].options = categories.value // 把分类选项塞给搜索表单里的分类下拉框

  handleSearch() // 默认查一次列表，页面一打开就能看到文章
})
</script>


