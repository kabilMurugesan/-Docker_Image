const { Op } = require('sequelize');

const getOffset = (page, limit) => {
  return page * limit - limit;
};

const paginate = async (model, query,search) => {
  try {
    const { page, size, sortBy, sortType } = query;
    const pageNo = parseInt(page, 10) || 1;
    let options = {};
    if (Object.keys(search).length) {
      options = { options, ...search };
    }
    options.order = sortBy ? [[sortBy,sortType]] : [['createdAt', 'desc']];
    options.limit = parseInt(size, 10) || 1;
    options.offset = ((pageNo-1)*size);
    const { count, rows } = await model.findAndCountAll(options);
    return {
      page,
      totalResults: count,
      nextPage: (count > size*page) ? true : false,
      results: rows
    };
  } catch (error) {
    return { status:"failed" ,message: "Something went wrong. Please contact admin. ",error: error};
  }
};

module.exports = paginate;
