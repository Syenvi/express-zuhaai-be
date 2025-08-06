import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { refreshIfActive } from "../../utils/refreshSessionData.js";

const prisma = new PrismaClient();

export const getProducts = async (req, res) => {
  try {
    const user_id = req.user.id;

    // query
    const page = parseInt(req.query.page) || 1;
    const sort = parseInt(req.query.sort) || 10;
    const search = req.query.s_name || "";

    const skip = (page - 1) * sort;

    const where_condition = {
      user_id,
      OR: search
        ? [
            {
              name: {
                contains: search,
              },
            },
          ]
        : undefined,
    };

    const total = await prisma.product.count({
      where: where_condition,
    });

    const last_page = Math.ceil(total / sort);

    const products = await prisma.product.findMany({
      where: where_condition,
      include: {
        images: {
          take: 1,
        },
      },
      skip,
      take: sort,
    });
    res.status(200).json({
      status: true,
      data: {
        last_page,
        data: products,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

export const createProduct = async (req, res) => {
  try {
    const { name, price, description, stock } = req.body;
    const image = req.file?.filename;

    const product = await prisma.product.create({
      data: {
        name,
        price: parseFloat(price),
        description,
        stock: parseInt(stock),
        user_id: req.user.id,
        images: {
          create: {
            url: image,
          },
        },
      },
      include: { images: true },
    });

    await refreshIfActive(req.user.id);

    res.status(201).json({
      status: true,
      data: product,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { name, price, description, stock } = req.body;
    const image = req.file?.filename;
    const productId = parseInt(req.params.id);

    const existing = await prisma.product.findUnique({
      where: { id: productId },
      include: { images: true },
    });

    if (!existing || existing.user_id !== req.user.id) {
      return res.status(404).json({
        status: false,
        message: "Product not found or unauthorized",
      });
    }

    // Hapus semua gambar lama dari DB dan disk
    if (image && existing.images.length > 0) {
      for (const img of existing.images) {
        const filepath = path.join("product-images", img.url);
        if (fs.existsSync(filepath)) {
          fs.unlinkSync(filepath); // hapus file dari disk
        }
      }

      await prisma.image.deleteMany({
        where: { product_id: productId },
      });
    }

    // Update data produk
    const updated = await prisma.product.update({
      where: { id: productId },
      data: {
        name,
        price: price ? parseFloat(price) : undefined,
        description,
        stock: stock ? parseInt(stock) : undefined,
        updated_at: new Date(),
        images: image
          ? {
              create: [{ url: image }],
            }
          : undefined,
      },
      include: { images: true },
    });

    await refreshIfActive(req.user.id);

    res.json({
      status: true,
      data: updated,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const productId = parseInt(req.params.id);

    const existing = await prisma.product.findUnique({
      where: { id: productId },
      include: { images: true },
    });

    if (!existing || existing.user_id !== req.user.id) {
      return res.status(404).json({
        status: false,
        message: "Product not found or unauthorized",
      });
    }

    // Hapus semua gambar lama dari DB dan disk
    if (existing.images.length > 0) {
      for (const img of existing.images) {
        const filepath = path.join("product-images", img.url);
        if (fs.existsSync(filepath)) {
          fs.unlinkSync(filepath); // hapus file dari disk
        }
      }

      await prisma.image.deleteMany({
        where: { product_id: productId },
      });
    }
    await prisma.product.delete({
      where: {
        id: productId,
      },
    });

    await refreshIfActive(req.user.id);

    res.status(200).json({
      status: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};
