<template>
    <div class="auth-layout"><!--界面-->
           <div class="left-section"><!--左侧内容-->
            <div class="content"><!--内容-->
                <h2 class="title"><!--标题-->心理ai助手</h2>
                <p class="text">每个深夜，每个焦虑的时刻，我们都在这里。不比独自承受。让心与心的连接温暖你一天</p>
                <div class="rabotImg"><!--机器人图片-->
                    <el-image style="width: 90px; height: 90px;" :src="robotImg" alt="robot" />
                </div>
            </div> 
        </div>
        <div class="right-section"><!--右侧内容-->
            <router-view></router-view>
        </div>
    </div>
</template>

<script setup>
const robotImg = new URL('@/assets/images/robot-fill.png', import.meta.url).href//机器人图片地址
</script>

<style scoped>
/*界面*/
.auth-layout {
    display: flex;
    .left-section {
        display: flex;
        justify-content: center;
        align-items: center;
        flex: 1;
        background: linear-gradient(90deg, rgb(74, 156, 140) 0%, rgb(61, 138, 122) 100%) rgba(74, 156, 140, 0.95);
        height: 100vh;
        /*左侧内容*/
        .content {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            .title {
                /*标题*/
                margin-bottom: 20px;
                font-size: 40px;
                font-weight: bold;
                color: #fff;
            }
            /*文本*/
            .text {
                margin-bottom: 20px;
                width: 460px;
                font-size: 20px;
                color: #fff;
                text-align: center;
            }
            /*机器人图片*/
            .rabotImg {
                display: flex;
                justify-content: center;
                align-items: center;
                width: 160px;
                height: 160px;
                border-radius: 50%;
                border: 2px solid rgba(255, 255, 255, 0.2);
                background: linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%);
                box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1),inset 0 1px 0 rgba(255, 255, 255, 0.3);
            }
        }
    }
    /*右侧内容*/
    .right-section {
        display: flex;
        justify-content: center;
        align-items: center;
        flex: 1;
        height: 100vh;
        background-color: #fff;
    }
}
</style>
