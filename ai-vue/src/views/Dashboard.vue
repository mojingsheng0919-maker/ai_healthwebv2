<template>
  <div class="dashboard-container">
    <!-- 第一行：上面四个统计卡片 -->
    <el-row :gutter="20">
      <el-col :span="6">
        <!-- 只有接口把 systemOverview 返回回来后，才显示这个卡片 -->
        <el-card v-if="aiData.systemOverview">
          <div class="card-content">
            <!-- 左边的小图标区域 -->
            <div class="avatar users">
              <el-image style="width: 40px; height: 40px" :src="iconUrl1" />
            </div>
            <!-- 右边的文字信息区域 -->
            <div class="info">
              <!-- 卡片标题 -->
              <p class="title">总用户数</p>
              <!-- 主要统计数字 -->
              <p class="number">{{ aiData.systemOverview.totalUsers }}</p>
              <!-- 次级说明文字 -->
              <p class="subtitle-title">活跃用户：{{ aiData.systemOverview.activeUsers }}</p>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <!-- 第二张卡片：情绪日志统计 -->
        <el-card v-if="aiData.systemOverview">
          <div class="card-content">
            <div class="avatar like">
              <el-image style="width: 40px; height: 40px" :src="iconUrl2" />
            </div>
            <div class="info">
              <p class="title">情绪日志</p>
              <p class="number">{{ aiData.systemOverview.totalDiaries }}</p>
              <p class="subtitle-title">今日新增：{{ aiData.systemOverview.todayNewDiaries }}</p>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <!-- 第三张卡片：咨询会话统计 -->
        <el-card v-if="aiData.systemOverview">
          <div class="card-content">
            <div class="avatar comments">
              <el-image style="width: 40px; height: 40px" :src="iconUrl3" />
            </div>
            <div class="info">
              <p class="title">咨询会话</p>
              <p class="number">{{ aiData.systemOverview.totalSessions }}</p>
              <p class="subtitle-title">今日新增：{{ aiData.systemOverview.todayNewSessions }}</p>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <!-- 第四张卡片：平均情绪统计 -->
        <el-card v-if="aiData.systemOverview">
          <div class="card-content">
            <div class="avatar smile">
              <el-image style="width: 40px; height: 40px" :src="iconUrl4" />
            </div>
            <div class="info">
              <p class="title">平均情绪</p>
              <p class="number">{{ aiData.systemOverview.avgMoodScore }}/10</p>
              <p class="subtitle-title">情绪健康指数</p>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    <!-- 第二行：两个并排图表 -->
    <el-row style="margin-top: 20px;" :gutter="20">
  <el-col :span="12">
    <!-- 左边卡片：情绪趋势分析 -->
    <el-card
      v-loading="chartsLoading"
      element-loading-text="分析图加载中..."
      style="width: 100%"
    >
      <template #header>
        <!-- 卡片头部标题 -->
        <div class="card-header">
          情绪趋势分析
        </div>
      </template>
      <div class="chart-content">
        <!-- 这是 ECharts 真正挂载的容器，图会画在这个 div 里面 -->
        <div ref="emotionChartRef" style="width: 100%;height:300px"></div>
      </div>
    </el-card>
  </el-col>
  <el-col :span="12">
     <!-- 右边卡片：咨询会话统计 -->
     <el-card
      v-loading="chartsLoading"
      element-loading-text="分析图加载中..."
      style="width: 100%"
    >
      <template #header>
        <div class="card-header">
          咨询会话统计
        </div>
      </template>
      <div class="chart-content">
        <!-- 这块先显示几个概览数字 -->
        <div v-if="aiData.consultationStats" class="consultation-stats">
          <div class="stat-item">
            <div class="stat-label">总会话数</div>
            <div class="stat-value">{{ aiData.consultationStats.totalSessions }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">平均时长</div>
            <div class="stat-value">{{ aiData.consultationStats.avgDurationMinutes }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">活跃用户</div>
            <div class="stat-value">{{ aiData.systemOverview.activeUsers }}</div>
          </div>
        </div>
        <!-- 这是咨询图表真正渲染的位置 -->
        <div ref="consultationChartRef" style="width: 100%; height:300px"></div>
      </div>
    </el-card>
  </el-col>
</el-row>
<!-- 第三行：整行宽度的用户活跃度趋势图 -->
<el-row style="margin-top: 20px;">
  <el-card
    v-loading="chartsLoading"
    element-loading-text="分析图加载中..."
    style="width: 100%"
  >
    <template #header>
      <div class="card-header">
        用户活跃度趋势
      </div>
    </template>
    <div class="chart-content">
      <!-- 用户活跃度图表挂载点 -->
      <div ref="userActivityChartRef" style="width: 100%; height:300px"></div>
    </div>
  </el-card>
</el-row>
  </div>
</template>

<script setup>
// 这个接口用来拿整个仪表盘页面要用到的统计数据
import { getArticleOverview } from '@/api/admin'
// onMounted：页面加载完执行
// ref：创建响应式变量
import { onMounted, ref} from 'vue'
// echarts：图表库，下面三个图都是靠它画出来的
import * as echarts from 'echarts'
// 下面四张图标图片，会显示在上面四个统计卡片左侧
const iconUrl1 = new URL('@/assets/images/users.png', import.meta.url).href
const iconUrl2 = new URL('@/assets/images/like.png', import.meta.url).href
const iconUrl3 = new URL('@/assets/images/comments.png', import.meta.url).href
const iconUrl4 = new URL('@/assets/images/smile.png', import.meta.url).href

// aiData 用来接接口返回的整个仪表盘数据对象
const aiData = ref({})
// 图表加载动画
const chartsLoading = ref(true)


// 统一初始化所有图表
// 页面数据回来后，会一次性执行这里
const initCharts = () => {
  initEmotionChart()
  initConsultationChart()
  initUserActivityChart()
}

// ==================== 情绪趋势图 ====================
// emotionChart 用来保存 echarts 图表实例，方便下次重新渲染前先销毁旧图
let emotionChart = null
// emotionChartRef 对应模板里那个 ref="emotionChartRef" 的 div
const emotionChartRef = ref(null)
const initEmotionChart = () => {
  // 如果页面上的图表容器还没拿到，就先不画
  if (!emotionChartRef.value) return
  // 如果之前已经画过一次图，先把旧图销毁，避免重复创建
  if (emotionChart) {
    emotionChart.dispose()
  }
  // 用当前这个 div 创建 echarts 图表实例
  emotionChart = echarts.init(emotionChartRef.value)
  // 从接口返回数据里取出“情绪趋势”这部分数据
  const TrendData = aiData.value.emotionTrend
  // option 就是图表的完整配置对象
  const option = {
    title: {
      // 图表顶部标题文字
      text: '情绪趋势分析',
      textStyle: {
        color: '#2d3436',
        fontSize: 16,
        fontWeight: 600
      },
      left: 'center',
      top: 10
    },
    tooltip: {
      // 鼠标移上去时显示提示框
      trigger: 'axis',
      borderColor: '#fab1a0',
      borderWidth: 1,
      textStyle: {
        color: '#2d3436',
        fontSize: 12
      }
    },
    legend: {
      // 图例，也就是上面那两个名字
      data: ['平均情绪评分', '记录数量'],
      top: 40
    },
    grid: {
      // 图表真正绘图区离四周的距离
      left: '3%',
      right: '4%',
      top: 80,
      bottom: '3%'
    },
    xAxis: {
      // X 轴显示日期
      type: 'category',
      data: TrendData.map(item => item.date),
      axisLine: {
        lineStyle: {
          color: '#2d3436'
        }
      }
    },
    yAxis: [{
      // 左边 Y 轴：情绪评分
      type: 'value',
      name: '情绪评分',
      position: 'left',
      axisLine: {
        lineStyle: {
          color: '#2d3436'
        }
      }
    }, {
      // 右边 Y 轴：记录数量
      type: 'value',
      name: '记录数量',
      position: 'right',
      axisLine: {
        lineStyle: {
          color: '#2d3436'
        }
      }
    }],
    series: [{
      // 第一条线：平均情绪评分
      name: '平均情绪评分',
      type: 'line',
      data: TrendData.map(item => item.avgMoodScore),
      smooth: true,
      lineStyle: {
        width: 3,
        color: '#faebaf'
      },
      itemStyle: {
        color: '#faebaf'
      }
    }, {
      // 第二条线：记录数量
      name: '记录数量',
      type: 'line',
      data: TrendData.map(item => item.recordCount),
      smooth: true,
      lineStyle: {
        width: 3,
        color: '#eeb5a3'
      },
      itemStyle: {
        color: '#eeb5a3'
      }
    }]
  }
  // 把上面配置真正渲染到图表上
  emotionChart.setOption(option)
}

// ==================== 咨询会话统计图 ====================
let consultationChart = null
// 对应模板里咨询图表那个 ref
const consultationChartRef = ref(null)
const initConsultationChart = () => {
  // 如果咨询图表容器还没拿到，就先不画
  if (!consultationChartRef.value) return
  // 如果之前已经有旧图，先销毁
  if (consultationChart) {
    consultationChart.dispose()
  }
  // 创建新的 echarts 图表实例
  consultationChart = echarts.init(consultationChartRef.value)
  // 从接口数据里取出咨询趋势那部分数组
  const dailyTrend = aiData.value.consultationStats.dailyTrend

  const option = {
  title: {
    // 图表标题
    text: '咨询活动统计',
    textStyle: {
      fontSize: 16,
      fontWeight: 600,
      color: '#2d3436'
    },
    left: 'center',
    top: 10
  },
  tooltip: {
    // 鼠标悬停时的提示框
    trigger: 'axis',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderColor: '#fab1a0',
    borderWidth: 1,
    textStyle: {
      color: '#2d3436'
    }
  },
  legend: {
    // 图例：会话数量 / 参与用户数
    data: ['会话数量', '参与用户数'],
    top: 40,
    textStyle: {
      color: '#636e72'
    }
  },
  grid: {
    // 图表绘图区边距
    left: '3%',
    right: '4%',
    bottom: '3%',
    top: 80,
    containLabel: true
  },
  xAxis: {
    // X 轴显示日期
    type: 'category',
    data: dailyTrend.map(item => item.date),
    axisLine: {
      lineStyle: {
        color: 'rgba(244, 162, 97, 0.3)'
      }
    },
    axisLabel: {
      color: '#636e72'
    }
  },
  yAxis: {
    // Y 轴显示数量
    type: 'value',
    axisLabel: {
      color: '#636e72'
    },
    axisLine: {
      lineStyle: {
        color: 'rgba(244, 162, 97, 0.3)'
      }
    },
    splitLine: {
      lineStyle: {
        color: 'rgba(244, 162, 97, 0.1)'
      }
    }
  },
  series: [
    {
      // 第一组柱子：会话数量
      name: '会话数量',
      type: 'bar',
      data: dailyTrend.map(item => item.sessionCount),
      itemStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: '#74b9ff' },
            { offset: 1, color: '#0984e3' }
          ]
        }
      },
      barWidth: '40%'
    },
    {
      // 第二组柱子：参与用户数
      name: '参与用户数',
      type: 'bar',
      data: dailyTrend.map(item => item.userCount),
      itemStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: '#fdcb6e' },
            { offset: 1, color: '#f39c12' }
          ]
        }
      },
      barWidth: '40%'
    }
  ]
}
  // 把配置渲染到咨询图表上
  consultationChart.setOption(option)
  }

// ==================== 用户活跃度趋势图 ====================
let userActivityChart = null
// 对应模板里用户活跃度图表的 ref
const userActivityChartRef = ref(null)
const initUserActivityChart = () => {
  // 如果图表容器还没有，就先退出
  if (!userActivityChartRef.value) return
  // 已经有旧图就先销毁
  if (userActivityChart) {
    userActivityChart.dispose()
  }
  // 创建新的 echarts 实例
  userActivityChart = echarts.init(userActivityChartRef.value)
  // 取出用户活跃度趋势数据
  const activityData = aiData.value.userActivity
  const option = {
  title: {
    // 图表标题
    text: '用户活跃度趋势',
    textStyle: {
      fontSize: 16,
      fontWeight: 600,
      color: '#2d3436'
    },
    left: 'center',
    top: 10
  },
  tooltip: {
    // 鼠标移上去的提示框
    trigger: 'axis',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderColor: '#fab1a0',
    borderWidth: 1,
    textStyle: {
      color: '#2d3436'
    }
  },
  legend: {
    // 上方图例
    data: ['活跃用户', '新增用户', '日记用户', '咨询用户'],
    top: 40,
    textStyle: {
      color: '#636e72'
    }
  },
  grid: {
    // 图表内边距
    left: '3%',
    right: '4%',
    bottom: '3%',
    top: 80,
    containLabel: true
  },
  xAxis: {
    // X 轴是日期
    type: 'category',
    data: activityData.map(item => item.date),
    axisLine: {
      lineStyle: {
        color: 'rgba(244, 162, 97, 0.3)'
      }
    },
    axisLabel: {
      color: '#636e72'
    }
  },
  yAxis: {
    // Y 轴是人数
    type: 'value',
    axisLabel: {
      color: '#636e72'
    },
    axisLine: {
      lineStyle: {
        color: 'rgba(244, 162, 97, 0.3)'
      }
    },
    splitLine: {
      lineStyle: {
        color: 'rgba(244, 162, 97, 0.1)'
      }
    }
  },
  series: [
    {
      // 第一条线：活跃用户
      name: '活跃用户',
      type: 'line',
      data: activityData.map(item => item.activeUsers),
      smooth: true,
      lineStyle: {
        width: 3,
        color: '#a29bfe'
      },
      itemStyle: {
        color: '#a29bfe'
      },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(162, 155, 254, 0.4)' },
            { offset: 1, color: 'rgba(162, 155, 254, 0.1)' }
          ]
        }
      }
    },
    {
      // 第二条线：新增用户
      name: '新增用户',
      type: 'line',
      data: activityData.map(item => item.newUsers),
      smooth: true,
      lineStyle: {
        width: 3,
        color: '#fdcb6e'
      },
      itemStyle: {
        color: '#fdcb6e'
      }
    },
    {
      // 第三条线：日记用户
      name: '日记用户',
      type: 'line',
      data: activityData.map(item => item.diaryUsers),
      smooth: true,
      lineStyle: {
        width: 3,
        color: '#00b894'
      },
      itemStyle: {
        color: '#00b894'
      }
    },
    {
      // 第四条线：咨询用户
      name: '咨询用户',
      type: 'line',
      data: activityData.map(item => item.consultationUsers),
      smooth: true,
      lineStyle: {
        width: 3,
        color: '#fab1a0'
      },
      itemStyle: {
        color: '#fab1a0'
      }
    }
  ]
}
// 把配置渲染到用户活跃度图表
userActivityChart.setOption(option)
}

// 页面一加载就去请求仪表盘数据
  onMounted(() => {
  // 接口返回后，把整份数据保存到 aiData
  getArticleOverview().then(res => {
    aiData.value = res
    // 数据一回来就初始化页面上的三个图
    initCharts()
  }).finally(() => {
    chartsLoading.value = false
  })
})

</script>

<style scoped lang="scss">
.dashboard-container {
    /* 卡片内部内容：图标和文字左右排 */
    .card-content {
      display: flex;
      align-items: center;
      /* 左边的图标盒子 */
      .avatar {
        margin-right: 12px;
        width: 60px;
        height: 60px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        /* 四种不同卡片用不同背景色 */
        &.users {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        &.like {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }
        &.comments {
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        }
        &.smile {
          background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
        }
      }
      /* 右边文字信息区域 */
      .info {
        /* 小标题样式 */
        .title {
          font-size: 14px;
          color: #7f8c8d;
          margin-bottom: 4px;
        }
        /* 大数字样式 */
        .value {
          font-size: 24px;
          font-weight: 700;
          color: #2c3e50;
          margin-bottom: 4px
        }
        /* 底下那行辅助说明 */
        .subtitle-title {
          font-size: 12px;
          color: #95a5a6;
        }
      }
    }
    /* 三个图表共同使用的内容区域样式 */
    .chart-content {
      padding: 20px;
      height: 300px;
      position: relative;

      /* 强制 canvas 占满容器，防止图表尺寸不对 */
      canvas {
        width: 100% !important;
        height: 100% !important;
      }

      /* 咨询会话统计卡片顶部那三个数字 */
      .consultation-stats {
        display: flex;
        justify-content: space-around;
        margin-bottom: 20px;

        /* 每一小块统计项 */
        .stat-item {
          text-align: center;

          /* 上面的标签文字 */
          .stat-label {
            font-size: 12px;
            color: #7f8c8d;
            margin-bottom: 4px;
          }

          /* 下面的统计数字 */
          .stat-value {
            font-size: 18px;
            font-weight: 600;
            color: #2c3e50;
          }
        }
      }
    }
  }
</style>
