/**
 * @file QueryBuilder.js
 * @description Advanced MongoDB Query Builder Utility
 *
 * WHY THIS EXISTS:
 * Instead of writing manual pagination, sorting, and filtering logic in every
 * single service (e.g., orderService, productService), we extract it into a
 * highly reusable class.
 *
 * This allows frontends to send queries like:
 * GET /api/v1/orders?status=delivered&totalPrice[gte]=100&sort=-createdAt&limit=5&fields=status,totalPrice
 */

"use strict";

class QueryBuilder {
  /**
   * @param {mongoose.Query} mongooseQuery - The Mongoose query object (e.g., Order.find())
   * @param {Object} queryString - The raw req.query object from Express
   */
  constructor(mongooseQuery, queryString) {
    this.mongooseQuery = mongooseQuery;
    this.queryString = queryString;
  }

  /**
   * 1. FILTERING
   * Handles basic equality matches and advanced range operators ($gte, $lte).
   */
  filter() {
    const queryObj = { ...this.queryString };
    
    // Remove fields that are meant for other builder methods
    const excludedFields = ["page", "sort", "limit", "fields", "search"];
    excludedFields.forEach((el) => delete queryObj[el]);

    // Advanced Filtering: Replace >=, <= with $gte, $lte for MongoDB
    // Example: { totalPrice: { gte: '100' } } -> { totalPrice: { $gte: '100' } }
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt|in)\b/g, (match) => `$${match}`);

    this.mongooseQuery = this.mongooseQuery.find(JSON.parse(queryStr));

    return this; // Return 'this' to allow method chaining
  }

  /**
   * 2. SEARCH (Regex & Case-Insensitive)
   * Implements a highly optimized regex search.
   * Note: For massive datasets, MongoDB Atlas Search or `$text` indexes are better.
   * This is for standard substring searches.
   *
   * @param {string[]} searchFields - Array of database fields to search in.
   */
  search(searchFields) {
    if (this.queryString.search && searchFields && searchFields.length > 0) {
      const searchRegex = new RegExp(this.queryString.search, "i"); // 'i' for case-insensitive

      // Build an $or query to search across multiple fields
      const orConditions = searchFields.map((field) => ({
        [field]: searchRegex,
      }));

      this.mongooseQuery = this.mongooseQuery.find({ $or: orConditions });
    }
    return this;
  }

  /**
   * 3. SORTING
   * Sorts the results. Defaults to newest first if no sort param is provided.
   */
  sort() {
    if (this.queryString.sort) {
      // Frontend sends: sort=price,-createdAt (comma separated)
      // Mongoose expects: sort('price -createdAt') (space separated)
      const sortBy = this.queryString.sort.split(",").join(" ");
      this.mongooseQuery = this.mongooseQuery.sort(sortBy);
    } else {
      this.mongooseQuery = this.mongooseQuery.sort("-createdAt"); // Default sort
    }
    return this;
  }

  /**
   * 4. FIELD LIMITING (Projection)
   * Optimizes network payload by only returning requested fields.
   */
  limitFields() {
    if (this.queryString.fields) {
      // Frontend sends: fields=name,price,status
      // Mongoose expects: select('name price status')
      const fields = this.queryString.fields.split(",").join(" ");
      this.mongooseQuery = this.mongooseQuery.select(fields);
    } else {
      // Always exclude __v (Mongoose internal versioning) to save bandwidth
      this.mongooseQuery = this.mongooseQuery.select("-__v");
    }
    return this;
  }

  /**
   * 5. PAGINATION
   * Handles limit and skip for paginated results.
   */
  paginate() {
    const page = parseInt(this.queryString.page, 10) || 1;
    const limit = parseInt(this.queryString.limit, 10) || 10;
    const skip = (page - 1) * limit;

    this.mongooseQuery = this.mongooseQuery.skip(skip).limit(limit);

    return this;
  }

  /**
   * 6. LEAN QUERIES (Optimization)
   * Converts Mongoose Documents to plain JavaScript objects.
   * Drastically reduces memory usage and improves query execution speed for read-only operations.
   */
  lean() {
    this.mongooseQuery = this.mongooseQuery.lean();
    return this;
  }
}

module.exports = QueryBuilder;
