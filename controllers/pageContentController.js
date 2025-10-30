
const { getPageContent } = require('../services/pageContent.service');

const getPageContentHandler = async (req, res) => {
  try {
    const { title } = req.params || req.query;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Page title is required'
      });
    }

    // Call the service function
    const result = await getPageContent(title);
    if (!result.pageContent) {
      return res.status(404).json({
        success: false,
        message: result.message || `No content found for title: ${title}`
      });
    }
    
    res.status(200).json({
    
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error in getPageContentHandler:', error);
    
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
};

module.exports = {
  getPageContentHandler
};
