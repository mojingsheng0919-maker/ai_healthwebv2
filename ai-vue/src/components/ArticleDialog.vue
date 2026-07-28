<template>
  <!-- 文章弹窗：新增文章和编辑文章都共用这一份 -->
  <el-dialog
    :title="isEdit ? 'edit article' : 'add article'" 
    v-model="dialogVisible" 
    width="50%" 
    @close="handleClose" 
  >
    <!-- 整个表单，model 是表单数据，rules 是校验规则，formRef 是后面校验/重置要用的实例 -->
    <el-form :model="formData" :rules="rules" ref="formRef" label-width="120px">
      <!-- 文章标题 -->
      <el-form-item label="Article Title" prop="title">
        <el-input v-model="formData.title" placeholder="Please input article title"  maxlength="200" show-word-limit clearable :validate-event="false" />
      </el-form-item>
      <!-- 文章分类 -->
      <el-form-item label="Category" prop="categoryId">
        <el-select v-model="formData.categoryId" placeholder="Please select article category">
          <!-- props.categories 是父组件传进来的分类列表 -->
          <el-option v-for="item in props.categories" :key="item.value" :label="item.label" 
          :value="item.value" />
        </el-select>
      </el-form-item>
      <!-- 文章摘要，这里是普通 textarea，不是富文本 -->
      <el-form-item label="Content" prop="summary">
        <el-input type="textarea" v-model="formData.summary" placeholder="Please input article content(selected)" maxlength="1000" show-word-limit :rows="4" />
      </el-form-item>
      <!-- 标签选择，支持多选，也支持自己输入新标签 -->
      <el-form-item label="Tags" prop="tags">
        <el-select v-model="formData.tagArray" placeholder="Please input article tags" multiple filterable allow-create style="width: 100%" >
          <el-option v-for="tag in commonTags" :key="tag" :label="tag" :value="tag" />
        </el-select>
      </el-form-item>
      <!-- 封面图上传 -->
      <el-form-item label="Cover Image" prop="coverImage">
        <div class="cover-upload-box">
          <!-- el-upload 只是借它的上传能力，真正上传逻辑在 handleUploadRequest -->
          <el-upload
            class="avatar-uploader"
            action="#"
            :before-upload="beforeAvatarUpload"
            :http-request="handleUploadRequest"
            :show-file-list="false"
            accept="image/*"
          >
          <!-- 还没选图时显示占位提示 -->
          <div v-if="!imgUrl" class="cover-placeholder">
                  <p>click to upload cover image</p>
          </div>
          <!-- 选了图以后显示图片预览 -->
          <img v-else :src="imgUrl" class="cover-image" alt="cover image" />
          </el-upload>
          <!-- 有图片时才显示删除按钮 -->
          <div v-if="imgUrl" class="cover-remove" >
                  <el-button type="danger" size="small" @click="handleRemove">delete</el-button>
          </div>
        </div>
      </el-form-item>
      <!-- 富文本正文 -->
      <el-form-item label="Article Content" prop="content">
        <RichTextEditor
          v-model="formData.content" 
          placeholder="Please input article content" 
          :maxCharCount="5000" 
          @change="handleContentChange" 
          @created="handleEditorCreate" 
          min-height="400px" 
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <!-- 取消按钮：关弹窗 -->
      <el-button @click="handleClose">Cancel</el-button>
      <!-- 提交按钮：新增时显示 add article，编辑时显示 update article -->
      <el-button type="primary" @click="handleSubmit" :loading="loading">{{isEdit ? 'update article' : 'add article'}}</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref , reactive ,computed , nextTick, watch } from 'vue' // ref/reactive 做响应式，computed 做计算属性，watch 监听数据变化
import { ElMessage } from 'element-plus' // 消息提示
import { uploadFile, submitArticle, updateArticle } from '@/api/admin' // 上传图片、新增文章、更新文章接口
import { fileBaseUrl } from '@/config/index' // 文件服务器地址前缀
import RichTextEditor from '@/components/RichTextEditor.vue' // 富文本编辑器组件

// props 是父组件传进来的数据
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  categories: {
    type: Array,
    default: () => []
  },
  article: {
    type: Object,
    default: null
  }
})

// emit 是子组件往父组件发消息
// update:modelValue：控制弹窗开关
// success：告诉父组件“我提交成功了”
const emit = defineEmits(['update:modelValue', 'success'])

// dialogVisible 其实就是把父组件传进来的 modelValue 做成一个双向绑定变量
const dialogVisible = computed({
  get: () =>{ return props.modelValue}, // 父组件传什么，这里就显示什么
  set: (val) => emit('update:modelValue', val) // 这里改了，也会通知父组件一起改
})

// 只要 article 里有 id，就说明当前是“编辑”；没有 id 就是“新增”
const isEdit = computed(() => !!props.article?.id)

// 监听父组件传进来的 article
// 当用户点“编辑”时，父组件会把文章详情传进来，这里就把数据回填到表单里
watch(() => props.article, (newVal) => {
  nextTick(() => {
    if (newVal) {
      Object.assign(formData, newVal) // 把后端返回的文章详情复制到表单对象里
      businessId.value = newVal.id // 编辑旧文章时，businessId 直接用现成文章 id
      
      imgUrl.value = newVal.coverImage ? fileBaseUrl + newVal.coverImage : '' // 有封面图就拼出完整图片地址，没有就留空
    }
  })
})

const formRef = ref(null) // 表单实例，后面校验和重置都要用它

// 手动重置表单数据
// 这个是“代码层面”清空数据，不只是清除界面显示
const resetFormData = () => {
  formData.title = ''
  formData.content = ''
  formData.coverImage = ''
  formData.categoryId = props.categories[0]?.value ?? 1
  formData.summary = ''
  formData.tags = ''
  formData.tagArray = []
  formData.id = ''
  imgUrl.value = ''
}

// 关闭弹窗
const handleClose = () => {
  formRef.value?.resetFields() // 先调用表单自己的重置
  businessId.value = null // 把上传业务 id 清掉
  formData.tagArray = [] // 标签数组单独清空一下，避免残留
  handleRemove() // 把封面图预览也清掉
  emit('update:modelValue', false) // 通知父组件关闭弹窗
}

// formData 就是整个弹窗表单真正提交的数据
const formData = reactive({
    "title": "",
    "content": "",
    "coverImage": "", 
    "categoryId": 1,
    "summary": "",
    "tagArray": [],
    "tags": "",
    "id": ""
})

// 表单校验规则
const rules = reactive({
  title: [
    { required: true, message: '请输入文章标题', trigger: 'change' }, // 标题必填
    { max: 200, message: '文章标题最多200个字符', trigger: 'change' } // 标题不能超过 200 个字
  ],
  categoryId: [
    { required: true, message: '请选择文章分类', trigger: 'change' } // 分类必选
  ],
  content: [
    { required: true, message: '请输入文章内容', trigger: 'blur' }, // 正文必填
    { max: 5000, message: '文章内容最多5000个字符', trigger: 'blur' } // 正文长度限制
  ]
})

// 常用标签列表，给标签下拉框使用
const commonTags = [
  '情绪管理', '焦虑', '抑郁', '压力', '睡眠', 
  '冥想', '正念', '放松', '心理健康', '自我成长',
  '人际关系', '工作压力', '学习方法', '生活技巧'
]

const imgUrl = ref('') // 页面上图片预览显示用的完整地址

// 上传前先做校验
// 这里只允许图片，并且限制 5MB 以内
const beforeAvatarUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt5MB = file.size / 1024 / 1024 < 5
  if (!isImage) {
    ElMessage.error('Please upload image')
    return false
  }
  if (!isLt5MB) {
    ElMessage.error('Image size must be less than 5MB')
    return false
  }

  return true

}

const businessId = ref(null) // 上传文件时用的业务 id，后端靠它把图片和文章关联起来

// 自定义上传逻辑
const handleUploadRequest = async ({file}) => {
  businessId.value = crypto.randomUUID() // 新增文章时先生成一个唯一业务 id
  const fileRes = await uploadFile(file, {
    businessId: businessId.value    
  })
  imgUrl.value = fileBaseUrl + fileRes.filePath // 页面显示用完整地址
  formData.coverImage = fileRes.filePath // 提交给后端只存相对路径，编辑回填时才拼 fileBaseUrl
}

// 删除封面图预览
const handleRemove = () => {
  imgUrl.value = ''
  formData.coverImage = ''
}

// 富文本内容变了以后，把最新 html 存回 formData.content
const handleContentChange = (data) => {
  formData.content = data.html
}

const editorInstance = ref(null) // 保存富文本实例，后面如果要手动操作编辑器会用到

// 富文本编辑器创建完成后会走这里
const handleEditorCreate = (editor) => {
  editorInstance.value = editor // 把实例先存起来

  if (formData.content && editor) {
    nextTick(() => {
      editor.setHtml(formData.content) // 编辑旧文章时，把原来的正文回填进富文本
    })
  }
}

const loading = ref(false) // 提交按钮的 loading 状态

// 点击提交按钮后走这里
const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false) // 先校验整个表单
  if (!valid) return // 校验不通过就直接停掉

  loading.value = true // 按钮进入 loading
  const submitData = {
    ...formData, // 先把表单所有数据展开
    tags: Array.isArray(formData.tagArray) ? formData.tagArray.join(',') : '' // 标签数组转成逗号分隔字符串
  }
  delete submitData.tagArray // 后端一般不要这个前端专用字段，所以删掉

  if (!isEdit.value) {
    // 新增文章
    submitData.businessId = businessId.value // 新增时把上传图片时用的业务 id 一起提交
    submitArticle(submitData).then(res => {
      loading.value = false // 关闭 loading
      emit('success') // 告诉父组件“新增成功了”
    })
  } else {
    // 编辑文章
    updateArticle(props.article.id, submitData).then(res => {
      loading.value = false // 关闭 loading
      emit('success') // 告诉父组件“更新成功了”
    })
  }
}

</script>

<style lang="scss" scoped>
/* 上传图片区整体区域：纵向排列，图片在上，删除按钮在下 */
.cover-upload-box {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

/* 没有图片时显示的占位框 */
.cover-placeholder {
  width: 200px;
  height: 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #8b949e;
  background: #f6f8fa;
}

/* 预览图片样式 */
.cover-image {
  width: 200px;
  height: 120px;
  display: block;
}

/* 删除按钮和图片之间留一点距离 */
.cover-remove {
  margin-top: 10px;
}
</style>
