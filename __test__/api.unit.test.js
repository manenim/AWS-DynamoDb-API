const { getPost, getAllPosts } = require('../api.js') 


test('Responses is an object', () => {
    expect(typeof getPost()).toBe('object')
})


// test that response object contains statuscode
