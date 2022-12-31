const Product = require('../models/product');

//two ways to build query  1)using json doc   2)using query builder (uses where)

const getAllProductsStatic = async (req, res) => {
  const products = await Product.find({ price: { $gt: 30 } })
    .sort('price')
    .select('name price')  // select which properties to show
    .limit(10)      //limits number of items to be shown
    .skip(5);      // skip items from start
  res.status(200).json({ products, nbHits: products.length });     //nbhits  number of hits
};
const getAllProducts = async (req, res) => {
  const { featured, company, name, sort, fields, numericFilters } = req.query;   //req.query has query  what does req.body have??????
  const queryObject = {};

  if (featured) {
    queryObject.featured = featured === 'true' ? true : false;
  }
  if (company) {
    queryObject.company = company;
  }
  if (name) {
    queryObject.name = { $regex: name, $options: 'i' };  //option i is for case insensitive // regex is for pattern matching        /pattern/  also works   ig   check pls
  }
  if (numericFilters) {   // because > = sign which are string in query need to be converted to gt lt etc
    const operatorMap = {
      '>': '$gt',
      '>=': '$gte',
      '=': '$eq',          // can add two or more to same key
      '<': '$lt',
      '<=': '$lte',
    };
    const regEx = /\b(<|>|>=|=|<|<=)\b/g;  //// /g global  /gi global case insensitive
    let filters = numericFilters.replace(
      regEx,
      (match) => `-${operatorMap[match]}-`    // on w3schools too
    );
    const options = ['price', 'rating'];
    filters = filters.split(',').forEach((item) => {
      const [field, operator, value] = item.split('-');
      if (options.includes(field)) {
        queryObject[field] = { [operator]: Number(value) };
      }
    });
  }




  let result = Product.find(queryObject);                  /// can simply do product.find(req.query) instead of all done above   but if we have garbage query or invalid query along with valid query then above code helps by ignoring    invalid/garbage --->  feature=true&age=val  we don't have age property in model hence is garbage query if only used req.query then empty array would be the response 


  // sort
  if (sort) {
    const sortList = sort.split(',').join(' ');  // split the query at  ,   // join them using ' ' in bw them,
    // key val pair with multiple values eg :-  sort=name,price  sort=name,-price
    result = result.sort(sortList);
  } else {
    result = result.sort('createdAt');
  }


  // selects fields to show  // its our choice how to name the query (key) // but we pass them to correct function accordingly
  if (fields) {
    const fieldsList = fields.split(',').join(' ');
    result = result.select(fieldsList);
  }
  const page = Number(req.query.page) || 1;          // because query key val are always strings so need to change them properly according to  their required datatype
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  result = result.skip(skip).limit(limit);
  // 23
  // 4 7 7 7 2

  const products = await result;
  res.status(200).json({ products, nbHits: products.length });
};

module.exports = {
  getAllProducts,
  getAllProductsStatic,
};
