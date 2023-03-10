const db = require("./db");
const {
    GetItemCommand,
    PutItemCommand,
    DeleteItemCommand,
    ScanCommand,
    UpdateItemCommand,
    QueryCommand,
} = require("@aws-sdk/client-dynamodb");
const { marshall, unmarshall } = require("@aws-sdk/util-dynamodb");


// create welcome route and return a welcome message
const welcome = async () => {
    return {
        statusCode: 200,
        body: JSON.stringify({
            message: "Welcome to the serverless blog API!",
        }),
    };
};

// get post by author where author is mani and the author attribute is a global secondary index
const getPostByAuthor = async (event) => {
    console.log('entered')
    const response = { statusCode: 200 };

   

// db.query(params, (err, data) => {
//   if (err) {
//     console.error("erre",  e);
//         response.statusCode = 500;
//         response.body = JSON.stringify({
//             message: "Failed to create post.",
//             errorMsg: e.message,
//             errorStack: e.stack,
//         });
//   } else {
//       console.log('data', data)
//      // Returns the matching items
//       response.body = JSON.stringify({
//           message: "Successfully retrieved post.",
//           data: data.Items.map((item) => unmarshall(item)),
//       });
//   }
// });
    
    try {
         const params = {
        TableName: process.env.DYNAMODB_TABLE_NAME,
        IndexName: "author-content-index", // Name of the GSI
        ExpressionAttributeValues: marshall({
            ":author":  event.pathParameters.author // Specify the value of the author to query
            }),
        KeyConditionExpression: "author = :author",
  
        };
        // const { Items } = await db.query(params).promise();
        // console.log('Items', Items)
        // response.body = JSON.stringify({
        //     message: "Successfully retrieved post.",
        //     data: Items.map((item) => unmarshall(item)),
        // });
        const command = new QueryCommand(params);
        const data = await db.send(command);
        console.log('data', data)
        response.body = JSON.stringify({
            message: "Successfully retrieved post.",
            data: data.Items.map((item) => unmarshall(item)),
        });
    } catch (err) {
        console.error("erre",  err);
        response.statusCode = 500;
        response.body = JSON.stringify({
            message: "Failed to find posts.",
            errorMsg: err.message,
            errorStack: err.stack,
        });
        
    }

    return response;
}

const getPost = async (event) => {
    const response = { statusCode: 200 };

    try {
        const params = {
            TableName: process.env.DYNAMODB_TABLE_NAME,
            Key: marshall({ postId: event.pathParameters.postId }),
        };
        const { Item } = await db.send(new GetItemCommand(params));

        console.log({ Item });
        response.body = JSON.stringify({
            message: "Successfully retrieved post.",
            data: (Item) ? unmarshall(Item) : {},
            rawData: Item,
        });
    } catch (e) {
        console.error(e);
        response.statusCode = 500;
        response.body = JSON.stringify({
            message: "Failed to get post.",
            errorMsg: e.message,
            errorStack: e.stack,
        });
    }

    return response;
};

const createPost = async (event) => {
    const response = { statusCode: 200 };

    try {
        const body = JSON.parse(event.body);
        const params = {
            TableName: process.env.DYNAMODB_TABLE_NAME,
            Item: marshall(body || {}),
        };
        const createResult = await db.send(new PutItemCommand(params));

        response.body = JSON.stringify({
            message: "Successfully created post.",
            createResult,
        });
    } catch (e) {
        console.error(e);
        response.statusCode = 500;
        response.body = JSON.stringify({
            message: "Failed to create post.",
            errorMsg: e.message,
            errorStack: e.stack,
        });
    }

    return response;
};

const updatePost = async (event) => {
    const response = { statusCode: 200 };

    try {
        const body = JSON.parse(event.body);
        const objKeys = Object.keys(body);
        const params = {
            TableName: process.env.DYNAMODB_TABLE_NAME,
            Key: marshall({ postId: event.pathParameters.postId }),
            UpdateExpression: `SET ${objKeys.map((_, index) => `#key${index} = :value${index}`).join(", ")}`,
            ExpressionAttributeNames: objKeys.reduce((acc, key, index) => ({
                ...acc,
                [`#key${index}`]: key,
            }), {}),
            ExpressionAttributeValues: marshall(objKeys.reduce((acc, key, index) => ({
                ...acc,
                [`:value${index}`]: body[key],
            }), {})),
        };
        const updateResult = await db.send(new UpdateItemCommand(params));

        response.body = JSON.stringify({
            message: "Successfully updated post.",
            updateResult,
        });
    } catch (e) {
        console.error(e);
        response.statusCode = 500;
        response.body = JSON.stringify({
            message: "Failed to update post.",
            errorMsg: e.message,
            errorStack: e.stack,
        });
    }

    return response;
};

const deletePost = async (event) => {
    const response = { statusCode: 200 };

    try {
        const params = {
            TableName: process.env.DYNAMODB_TABLE_NAME,
            Key: marshall({ postId: event.pathParameters.postId }),
        };
        const deleteResult = await db.send(new DeleteItemCommand(params));

        response.body = JSON.stringify({
            message: "Successfully deleted post.",
            deleteResult,
        });
    } catch (e) {
        console.error(e);
        response.statusCode = 500;
        response.body = JSON.stringify({
            message: "Failed to delete post.",
            errorMsg: e.message,
            errorStack: e.stack,
        });
    }

    return response;
};

const getAllPosts = async () => {
    const response = { statusCode: 200 };

    try {
        const { Items } = await db.send(new ScanCommand({ TableName: process.env.DYNAMODB_TABLE_NAME }));

        response.body = JSON.stringify({
            message: "Successfully retrieved all posts.",
            data: Items.map((item) => unmarshall(item)),
            Items,
        });
    } catch (e) {
        console.error(e);
        response.statusCode = 500;
        response.body = JSON.stringify({
            message: "Failed to retrieve posts.",
            errorMsg: e.message,
            errorStack: e.stack,
        });
    }

    return response;
};

module.exports = {
    welcome,
    getPost,
    createPost,
    updatePost,
    deletePost,
    getAllPosts,
    getPostByAuthor
};