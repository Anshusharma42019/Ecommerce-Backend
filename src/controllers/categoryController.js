'use strict';

const categoryService = require('../services/categoryService');
const { sendSuccess } = require('../helpers/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { MESSAGES, HTTP_STATUS } = require('../constants');

const getAllCategories = asyncHandler(async (req, res) => {
  const categories = await categoryService.getAllCategories();
  sendSuccess(res, MESSAGES.FETCHED, categories);
});

const getCategoryTree = asyncHandler(async (req, res) => {
  const tree = await categoryService.getCategoryTree();
  sendSuccess(res, MESSAGES.FETCHED, tree);
});

const getCategoryBySlug = asyncHandler(async (req, res) => {
  const cat = await categoryService.getCategoryBySlug(req.params.slug);
  sendSuccess(res, MESSAGES.FETCHED, cat);
});

const createCategory = asyncHandler(async (req, res) => {
  const cat = await categoryService.createCategory(req.body, req.file);
  sendSuccess(res, MESSAGES.CREATED, cat, HTTP_STATUS.CREATED);
});

const updateCategory = asyncHandler(async (req, res) => {
  const cat = await categoryService.updateCategory(req.params.id, req.body, req.file);
  sendSuccess(res, MESSAGES.UPDATED, cat);
});

const deleteCategory = asyncHandler(async (req, res) => {
  const result = await categoryService.deleteCategory(req.params.id);
  sendSuccess(res, result.message);
});

module.exports = { getAllCategories, getCategoryTree, getCategoryBySlug, createCategory, updateCategory, deleteCategory };
