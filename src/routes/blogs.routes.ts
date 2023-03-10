import {Request, Response, Router} from "express"
export const blogsRouter = Router({});
import {blogsTypes} from "../types/blogs.types";
import {postsTypes} from "../types/posts.types";
import {
    createBlogValidator,
    createPostForBlog,
    inputValidationMiddleware
} from "../middlewares/middlewares.validators";
import {getPaginationFromQueryPosts} from "./posts.routes";
import {blogsService} from "../domain/blogs.service";

export const expressBasicAuth = require('express-basic-auth');
export const adminStatusAuth = expressBasicAuth({users: {'admin': 'qwerty'}});

export type PaginationQueryTypeForBlogs = {
    searchNameTerm: string,
    sortBy: string,
    sortDirection: 'asc' | 'desc',
    pageNumber: number,
    pageSize: number,
}

export const getPaginationFromQueryBlogs = (query: any): PaginationQueryTypeForBlogs => {

    const pageNumber = parseInt(query.pageNumber, 10);
    const pageSize = parseInt(query.pageSize, 10);
    const sortDirection = query.sortDirection === 'asc' ? 'asc' : 'desc';

    return {
        searchNameTerm: query.searchNameTerm ?? '',
        sortBy: query.sortBy ?? 'createdAt',
        sortDirection,
        pageNumber: isNaN(pageNumber) ? 1 : pageNumber,
        pageSize: isNaN(pageSize) ? 10 : pageSize,
    };
};


//delete all
blogsRouter.delete('/all-data', async (req: Request, res: Response) => {
    await blogsService.deleteAll();
    res.sendStatus(204);
    return;
});


//get all blogs
blogsRouter.get('/', async (req: Request, res: Response) => {

    const pagination = getPaginationFromQueryBlogs(req.query);
    const allBlogs = await blogsService.allBlogs(pagination);
    res.status(200).send(allBlogs);
});


//create new blogs
blogsRouter.post('/', adminStatusAuth, createBlogValidator, inputValidationMiddleware, async (req: Request, res: Response) => {
    const newBlog: blogsTypes = await blogsService.createNewBlog(req.body)

    if (newBlog) {
        res.status(201).send(newBlog);
        return;
    } else {
        res.sendStatus(404);
        return;
    }
});

//get posts for specified blog
blogsRouter.get('/:blogId/posts', async (req: Request, res: Response) => {

    const foundBlog: blogsTypes | null = await blogsService.getBlogById(req.params.blogId);

    if(foundBlog)
    {
        const pagination = getPaginationFromQueryPosts(req.query);
        const postsForBlog = await blogsService.getPostsForBlog(pagination, foundBlog.id);

        res.status(200).send(postsForBlog);
        return;
    }
    else
    {
        res.sendStatus(404);
        return
    }
});

//create new post for specific blog
blogsRouter.post('/:blogId/posts', adminStatusAuth , createPostForBlog, inputValidationMiddleware, async (req: Request, res: Response) => {

    const foundBlog: blogsTypes | null = await blogsService.getBlogById(req.params.blogId);

    if (foundBlog) {
        const newPostsForBlog: postsTypes = await blogsService.createPostForSpecificBlog(req.body, req.params.blogId, foundBlog.name)
        res.status(201).send(newPostsForBlog);
        return;
    } else {
        res.sendStatus(404);
        return;
    }
});

//get blogs by ID
blogsRouter.get('/:id', async (req: Request, res: Response) => {

    const BlogWithId: blogsTypes | null = await blogsService.getBlogById(req.params.id);

    if (BlogWithId) {
        res.status(200).send(BlogWithId);
        return;
    } else {
        res.sendStatus(404);
        return;
    }
});

//update blogs by ID
blogsRouter.put('/:id', adminStatusAuth, createBlogValidator, inputValidationMiddleware, async (req: Request, res: Response) => {
    const isUpdated = await blogsService.updateBlog(req.body, req.params.id);

    if (isUpdated) {
        res.sendStatus(204);
        return;
    } else {
        res.sendStatus(404);
        return;
    }
});

//delete blog by id
blogsRouter.delete('/:id', adminStatusAuth, inputValidationMiddleware, async (req: Request, res: Response) => {
    const isDelete = await blogsService.deleteBlogById(req.params.id);

    if (isDelete) {
        res.sendStatus(204);
        return;
    } else {
        res.sendStatus(404);
        return;
    }
});