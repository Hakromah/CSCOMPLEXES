//import { factories } from '@strapi/strapi';
//export default factories.createCoreController('api::exam-result.exam-result');

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::exam-result.exam-result', ({ strapi }) => ({
  // Override the main GET list endpoint
  async find(ctx) {
    ctx.query = {
      ...ctx.query,
      populate: {
        student: true,
        exam: {
          populate: {
            classe: true,
          },
        },
      },
    };
    
    // Execute the built-in Strapi logic with our new population query applied
    return await super.find(ctx);
  },

  // Override the single item GET endpoint (e.g., /api/exam-results/:id)
  async findOne(ctx) {
    ctx.query = {
      ...ctx.query,
      populate: {
        student: true,
        exam: {
          populate: {
            classe: true,
          },
        },
      },
    };
    return await super.findOne(ctx);
  }
}));
