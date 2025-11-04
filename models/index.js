// 모든 모델을 한 곳에서 export
const User = require('./User');
const Product = require('./Product');
const Review = require('./Review');
const Keyword = require('./Keyword');
const ProductInsight = require('./ProductInsight');
const AnalysisHistory = require('./AnalysisHistory');
const Log = require('./Log');

module.exports = {
  User,
  Product,
  Review,
  Keyword,
  ProductInsight,
  AnalysisHistory,
  Log
};