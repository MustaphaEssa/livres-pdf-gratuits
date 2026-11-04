import { Prisma } from "@prisma/client";
import prisma from "@/lib/db";

const postWithCategories = Prisma.validator<Prisma.PostDefaultArgs>()({
  include: {
    categories: { include: { category: { select: { name: true, slug: true } } } },
  },
});

export type PostWithCategories = Prisma.PostGetPayload<typeof postWithCategories>;

// Articles publiés (liste publique)
export async function getPublishedPosts(): Promise<PostWithCategories[]> {
  return prisma.post.findMany({
    where: { isPublished: true },
    include: postWithCategories.include,
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
  });
}

// Article publié par slug
export async function getPublishedPostBySlug(
  slug: string
): Promise<PostWithCategories | null> {
  const post = await prisma.post.findUnique({
    where: { slug },
    include: postWithCategories.include,
  });
  if (!post || !post.isPublished) return null;
  return post;
}

// Tous les articles (admin)
export async function getAllPosts(): Promise<PostWithCategories[]> {
  return prisma.post.findMany({
    include: postWithCategories.include,
    orderBy: { createdAt: "desc" },
  });
}

export async function getPostById(id: string): Promise<PostWithCategories | null> {
  return prisma.post.findUnique({
    where: { id },
    include: postWithCategories.include,
  });
}

export interface PostInput {
  title: string;
  slug: string;
  excerpt?: string | null;
  content: string;
  coverImage?: string | null;
  author?: string | null;
  isPublished?: boolean;
  isFeatured?: boolean;
  categorySlug?: string;
}

export async function createPost(input: PostInput): Promise<PostWithCategories> {
  const { categorySlug, ...data } = input;
  let catConnect: Prisma.PostCategoryCreateNestedManyWithoutPostInput | undefined;
  if (categorySlug) {
    const cat = await prisma.category.findUnique({ where: { slug: categorySlug } });
    if (cat) catConnect = { create: [{ categoryId: cat.id }] };
  }
  return prisma.post.create({
    data: {
      ...data,
      publishedAt: data.isPublished ? new Date() : null,
      categories: catConnect,
    },
    include: postWithCategories.include,
  });
}

export async function updatePost(
  id: string,
  input: Partial<PostInput>
): Promise<PostWithCategories> {
  const { categorySlug, ...data } = input;
  if (categorySlug !== undefined) {
    const cat = await prisma.category.findUnique({ where: { slug: categorySlug } });
    await prisma.postCategory.deleteMany({ where: { postId: id } });
    if (cat) {
      await prisma.postCategory.create({ data: { postId: id, categoryId: cat.id } });
    }
  }
  // Fixe publishedAt au premier passage en publié
  const current = await prisma.post.findUnique({ where: { id } });
  const extra: { publishedAt?: Date } = {};
  if (data.isPublished && current && !current.publishedAt) {
    extra.publishedAt = new Date();
  }
  return prisma.post.update({
    where: { id },
    data: { ...data, ...extra },
    include: postWithCategories.include,
  });
}

export async function deletePost(id: string): Promise<void> {
  await prisma.post.delete({ where: { id } });
}

export async function slugExistsPost(slug: string, exceptId?: string): Promise<boolean> {
  return (
    (await prisma.post.count({
      where: { slug, ...(exceptId ? { id: { not: exceptId } } : {}) },
    })) > 0
  );
}

// Commentaires approuvés d'un article
export async function getApprovedComments(postId: string) {
  return prisma.comment.findMany({
    where: { postId, isApproved: true },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, content: true, createdAt: true },
  });
}
