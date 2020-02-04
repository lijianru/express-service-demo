const express = require('express');
const cors = require('cors');
const adminRouter = require('./routes/admin/index');
const db = require('./plugins/db');
const path = require('path');

const app = express();

// 设置一个全局变量
app.set('secrte', 'token');

// 支持跨域访问
app.use(cors());

// 支持获取request body中的参数
app.use(express.json());

// 托管静态文件
app.use('/uploads', express.static(path.resolve(__dirname, './uploads')));

// 数据库
db(app);

// admin 路由
adminRouter(app);

app.listen(3000, () => {
  console.log('服务启动成功！');
});
