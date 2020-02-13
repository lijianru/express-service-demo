module.exports = (app) => {
  const express = require('express');
  const inflection = require('inflection');
  const muter = require('multer');
  const path = require('path');
  const AdminUser = require('../../models/AdminUser');
  const bcrypc = require('bcrypt');
  const jwt = require('jsonwebtoken');
  const httpAssert = require('http-assert');

  // eslint-disable-next-line new-cap
  const router = express.Router({mergeParams: true});

  // 获取列表
  router.get('/', async (req, res) => {
    const queryOptions = {};
    if (req.Model.modelName === 'Category') {
      queryOptions.populate = 'parent';
    }
    // populate('parent') 关联查询
    // limit(10) 限制为10条
    const data = await req.Model.find().setOptions(queryOptions).limit(10);

    res.json(data);
  });

  // 新增
  router.post('/', async (req, res) => {
    const model = await req.Model.create(req.body);

    res.send(model);
  });

  // 更新
  router.put('/:id', async (req, res) => {
    const data = await req.Model.findById(req.params.id);
    Object.assign(data, req.body);

    await data.save();

    res.send(data);
  });

  // 删除
  router.delete('/:id', async (req, res) => {
    const data = await req.Model.findById(req.params.id);
    await data.delete();

    res.send({
      success: true,
    });
  });

  const verifyUserMiddleware = async (req, res, next) => {
    const token = String(req.headers.authorization || '').split(' ').pop();
    httpAssert(token, 401, 'token 不存在！');
    const {id} = jwt.verify(token, app.get('secrte'));
    httpAssert(id, 401, 'token 异常！');
    const user = await AdminUser.findById(id);
    httpAssert(user, 401, '用户未登录！');

    await next();
  };

  const requireModelmiddleware = async (req, res, next) => {
    // 将动态转递的参数
    const modelName = inflection.classify(req.params.resource);
    // TODO 需要做容错，是否存在该模块
    let Model;
    try {
      Model = require(`../../models/${modelName}`);
    } catch (err) {
      httpAssert(!err, 404, '接口不存在！');
    }
    req.Model = Model;
    next();
  };

  // eslint-disable-next-line max-len
  app.use('/admin/api/rest/:resource', verifyUserMiddleware, requireModelmiddleware, router);

  // 上传
  const uploadMiddleware = muter({
    dest: path.resolve(__dirname, '../../uploads'),
  });
  // eslint-disable-next-line max-len
  app.post('/admin/api/upload', verifyUserMiddleware, uploadMiddleware.single('file'), async (req, res) => {
    const file = req.file;
    console.log(file);
    file.url = `http://127.0.0.1:3000/uploads/${file.filename}`;
    res.send(file);
  });

  // 登录
  app.post('/admin/api/login', async (req, res) => {
    const {username, password} = req.body;
    const user = await AdminUser.findOne({username}).select('+password');
    httpAssert(user, 422, '用户不存在！');
    const isVliad = bcrypc.compareSync(password, user.password);
    httpAssert(isVliad, 422, '密码不正确！');
    const token = jwt.sign({id: user._id}, app.get('secrte'));
    res.send({token});
  });

  // 错误处理
  app.use(async (err, req, res, next) => {
    res.status(err.statusCode || 500).send({
      message: err.message,
    });
  });
};
