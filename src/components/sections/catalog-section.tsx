"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { t, isRTL } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  Package,
  Plus,
  Search,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  DollarSign,
  Tag,
  Settings2,
  Loader2,
  ArrowUp,
  ArrowDown,
  ImageIcon,
} from "lucide-react";
import { uploadImage, deleteImage } from "@/lib/storage";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Branch {
  id: string;
  name: string;
  nameAr: string;
}

interface CategoryItem {
  id: string;
  label: string;
  color: string;
  image?: string;
}

interface StaffMember {
  id: string;
  name: string;
  branchId?: string | null;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  images: string[];
  category: string; // category id or "" for uncategorized
  isAvailable: boolean;
  availableAtHome: boolean;
  availableAtSalon: boolean;
  notes: string;
  sortOrder: number;
  type: 'service' | 'product';
  stock: number | null;
  branchId?: string | null;
  Branch?: Branch | null;
  durationMinutes?: number;
  durationMode?: 'time' | 'queue';
  depositAmount?: number;
  publishAt?: string | null;
}

interface ProductFormData {
  name: string;
  description: string;
  price: string;
  images: string[];
  category: string;
  isAvailable: boolean;
  availableAtHome: boolean;
  availableAtSalon: boolean;
  notes: string;
  stock: number | null;
  branchId: string;
  durationMinutes: number;
  durationMode: 'time' | 'queue';
  depositAmount: number;
  publishAt: string;
}

export type CatalogMode = 'services' | 'products';

interface CategoryFormData {
  label: string;
  color: string;
  image: string;
}

// ─── Color Map ────────────────────────────────────────────────────────────────

const colorMap: Record<string, {
  bg: string;
  iconBg: string;
  text: string;
  border: string;
  activeBg: string;
  activeText: string;
  activeBorder: string;
}> = {
  sage: {
    bg: "bg-sage-50 dark:bg-sage-900/20",
    iconBg: "bg-sage-100 dark:bg-sage-900/30",
    text: "text-sage-700 dark:text-sage-400",
    border: "border-sage-200 dark:border-sage-800/40",
    activeBg: "bg-sage-100 dark:bg-sage-800/40",
    activeText: "text-sage-700 dark:text-sage-300",
    activeBorder: "border-sage-300 dark:border-sage-700",
  },
  sand: {
    bg: "bg-sand-50 dark:bg-sand-900/20",
    iconBg: "bg-sand-100 dark:bg-sand-900/30",
    text: "text-sand-700 dark:text-sand-400",
    border: "border-sand-200 dark:border-sand-800/40",
    activeBg: "bg-sand-100 dark:bg-sand-800/40",
    activeText: "text-sand-700 dark:text-sand-300",
    activeBorder: "border-sand-300 dark:border-sand-700",
  },
  terracotta: {
    bg: "bg-terracotta-50 dark:bg-terracotta-900/20",
    iconBg: "bg-terracotta-100 dark:bg-terracotta-900/30",
    text: "text-terracotta-700 dark:text-terracotta-400",
    border: "border-terracotta-200 dark:border-terracotta-800/40",
    activeBg: "bg-terracotta-100 dark:bg-terracotta-800/40",
    activeText: "text-terracotta-700 dark:text-terracotta-300",
    activeBorder: "border-terracotta-300 dark:border-terracotta-700",
  },
  pink: {
    bg: "bg-pink-50 dark:bg-pink-900/20",
    iconBg: "bg-pink-100 dark:bg-pink-900/30",
    text: "text-pink-700 dark:text-pink-400",
    border: "border-pink-200 dark:border-pink-800/40",
    activeBg: "bg-pink-100 dark:bg-pink-800/40",
    activeText: "text-pink-700 dark:text-pink-300",
    activeBorder: "border-pink-300 dark:border-pink-700",
  },
  amber: {
    bg: "bg-amber-50 dark:bg-amber-900/20",
    iconBg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-700 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-800/40",
    activeBg: "bg-amber-100 dark:bg-amber-800/40",
    activeText: "text-amber-700 dark:text-amber-300",
    activeBorder: "border-amber-300 dark:border-amber-700",
  },
  emerald: {
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
    text: "text-emerald-700 dark:text-emerald-400",
    border: "border-emerald-200 dark:border-emerald-800/40",
    activeBg: "bg-emerald-100 dark:bg-emerald-800/40",
    activeText: "text-emerald-700 dark:text-emerald-300",
    activeBorder: "border-emerald-300 dark:border-emerald-700",
  },
};

const availableColors = ["sage", "sand", "terracotta", "pink", "amber", "emerald"] as const;

// Color circle preview swatches for the color picker
const colorCircleMap: Record<string, string> = {
  sage: "bg-sage-400",
  sand: "bg-sand-400",
  terracotta: "bg-terracotta-400",
  pink: "bg-pink-400",
  amber: "bg-amber-400",
  emerald: "bg-emerald-400",
};

// Fallback neutral styling for uncategorized or unknown categories
const neutralStyles = {
  bg: "bg-gray-50 dark:bg-gray-900/20",
  iconBg: "bg-gray-100 dark:bg-gray-900/30",
  text: "text-gray-700 dark:text-gray-400",
  border: "border-gray-200 dark:border-gray-800/40",
  activeBg: "bg-gray-100 dark:bg-gray-800/40",
  activeText: "text-gray-700 dark:text-gray-300",
  activeBorder: "border-gray-300 dark:border-gray-700",
};

// ─── Initial Data ─────────────────────────────────────────────────────────────

// No hardcoded categories — they come from the database

// ─── Helpers ──────────────────────────────────────────────────────────────────

const emptyProductFormData: ProductFormData = {
  name: "",
  description: "",
  price: "",
  images: [],
  category: "",
  isAvailable: true,
  availableAtHome: false,
  availableAtSalon: true,
  notes: "",
  stock: null,
  branchId: "none",
  durationMinutes: 30,
  durationMode: 'time',
  depositAmount: 0,
  publishAt: "",
};

const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120, 180];

const PUBLISH_OPTIONS = [
  { value: "", labelAr: "حالاً", labelEn: "Immediately" },
  { value: "1", labelAr: "بعد يوم", labelEn: "After 1 day" },
  { value: "2", labelAr: "بعد يومين", labelEn: "After 2 days" },
  { value: "3", labelAr: "بعد 3 أيام", labelEn: "After 3 days" },
  { value: "7", labelAr: "بعد أسبوع", labelEn: "After 1 week" },
];

const emptyCategoryFormData: CategoryFormData = {
  label: "",
  color: "sage",
  image: "",
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getCategoryStyles(cat: CategoryItem | undefined, key: "bg" | "iconBg" | "text" | "border" | "activeBg" | "activeText" | "activeBorder"): string {
  if (!cat) return neutralStyles[key];
  const map = colorMap[cat.color];
  if (!map) return neutralStyles[key];
  return map[key];
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CatalogSection({ mode = 'services' }: { mode?: CatalogMode }) {
  const { locale } = useAppStore();
  const rtl = isRTL(locale);
  const isServices = mode === 'services';
  const typeFilter = isServices ? 'service' : 'product';

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [filterBranch, setFilterBranch] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  // Product dialog states
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(emptyProductFormData);
  const [isUploading, setIsUploading] = useState(false);

  // Category management dialog states
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [categoryFormData, setCategoryFormData] = useState<CategoryFormData>(emptyCategoryFormData);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [deleteCategoryDialogOpen, setDeleteCategoryDialogOpen] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<CategoryItem | null>(null);

  // Staff assignment states (services mode only)
  const [allStaff, setAllStaff] = useState<StaffMember[]>([]);
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);

  const fetchCategories = async () => {
    try {
      const res = await fetch(`/api/categories?type=${typeFilter}`);
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch categories", err);
    }
  };

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/products?type=${typeFilter}`);
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch products", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const res = await fetch("/api/branches?active=true");
      const data = await res.json();
      setBranches(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch branches", err);
    }
  };

  React.useEffect(() => {
    fetchCategories();
    fetchProducts();
    fetchBranches();
    if (isServices) fetchAllStaff();
  }, []);

  // Fetch all staff for assignment
  const fetchAllStaff = async () => {
    try {
      const res = await fetch("/api/staff");
      const data = await res.json();
      setAllStaff(Array.isArray(data) ? data.filter((s: any) => s.isActive) : []);
    } catch (err) {
      console.error("Failed to fetch staff", err);
    }
  };

  // Fetch assigned staff for a product (when editing)
  const fetchAssignedStaff = async (productId: string) => {
    try {
      const res = await fetch(`/api/staff-services?productId=${productId}`);
      const data = await res.json();
      setSelectedStaffIds(Array.isArray(data) ? data.map((d: any) => d.staff_id) : []);
    } catch (err) {
      console.error("Failed to fetch assigned staff", err);
      setSelectedStaffIds([]);
    }
  };

  // ─── Derived Data ─────────────────────────────────────────────────────────

  const hasUncategorized = useMemo(() => {
    return products.some((p) => !p.category || !categories.find((c) => c.id === p.category));
  }, [products, categories]);

  const getCategoryLabel = (catId: string): string => {
    const cat = categories.find((c) => c.id === catId);
    if (!cat) return t(locale, "catalog.uncategorized");
    return cat.label;
  };

  const getCategoryById = (catId: string): CategoryItem | undefined => {
    return categories.find((c) => c.id === catId);
  };

  // ─── Filtering ────────────────────────────────────────────────────────────

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const nameMatch = p.name?.toLowerCase().includes(searchQuery.toLowerCase());

      let categoryMatch = true;
      if (activeCategory === "uncategorized") {
        categoryMatch = !p.category || !categories.find((c) => c.id === p.category);
      } else if (activeCategory !== "all") {
        categoryMatch = p.category === activeCategory;
      }

      let branchMatch = true;
      if (filterBranch === "unassigned") {
        branchMatch = !p.branchId;
      } else if (filterBranch !== "all") {
        branchMatch = p.branchId === filterBranch;
      }

      return nameMatch && categoryMatch && branchMatch;
    });
  }, [products, searchQuery, activeCategory, filterBranch, categories]);

  // ─── Product Handlers ─────────────────────────────────────────────────────

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      ...emptyProductFormData,
      category: categories.length > 0 ? categories[0].id : "",
    });
    setSelectedStaffIds([]);
    setProductDialogOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || "",
      description: product.description || "",
      price: product.price || "",
      images: product.images || [],
      category: product.category || "",
      isAvailable: product.isAvailable,
      availableAtHome: product.availableAtHome ?? false,
      availableAtSalon: product.availableAtSalon ?? true,
      notes: product.notes || "",
      stock: product.stock ?? null,
      branchId: product.branchId || "none",
      durationMinutes: product.durationMinutes ?? 30,
      durationMode: product.durationMode ?? 'time',
      depositAmount: product.depositAmount ?? 0,
      publishAt: product.publishAt || "",
    });
    if (isServices) fetchAssignedStaff(product.id);
    setProductDialogOpen(true);
  };

  const handleOpenDelete = (product: Product) => {
    setDeletingProduct(product);
    setDeleteDialogOpen(true);
  };

  const handleSaveProduct = async () => {
    // Calculate publishAt date if set
    let publishAtValue: string | null = null;
    if (formData.publishAt && formData.publishAt !== "") {
      const days = parseInt(formData.publishAt);
      const d = new Date();
      d.setDate(d.getDate() + days);
      publishAtValue = d.toISOString();
    }

    const payload: Record<string, unknown> = {
      name: formData.name,
      description: formData.description,
      price: formData.price,
      images: formData.images,
      category: formData.category,
      isAvailable: formData.isAvailable,
      availableAtHome: formData.availableAtHome,
      availableAtSalon: formData.availableAtSalon,
      notes: formData.notes,
      type: typeFilter,
      stock: isServices ? null : (formData.stock ?? 0),
      branchId: formData.branchId === "none" ? null : formData.branchId,
      durationMinutes: formData.durationMinutes,
      durationMode: formData.durationMode,
      depositAmount: formData.depositAmount,
      publishAt: publishAtValue,
    };

    try {
      let savedProductId: string | null = null;
      if (editingProduct) {
        // Find images that were in the original product but are no longer in the form data
        const removedImages = (editingProduct.images || []).filter(img => !formData.images.includes(img));
        if (removedImages.length > 0) {
          Promise.all(removedImages.map(img => deleteImage(img))).catch(console.error);
        }

        const res = await fetch(`/api/products/${editingProduct.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const updatedProduct = await res.json();
        savedProductId = editingProduct.id;
        // Update in-place to preserve sort order
        setProducts(prev => prev.map(p => p.id === editingProduct.id ? { ...p, ...updatedProduct } : p));
      } else {
        const res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const newProduct = await res.json();
        savedProductId = newProduct.id;
        setProducts(prev => [...prev, newProduct]);
      }

      // Save staff assignments
      if (savedProductId && isServices) {
        await saveStaffAssignments(savedProductId);
      }
    } catch (err) {
      console.error("Failed to save product", err);
    }

    setProductDialogOpen(false);
    setEditingProduct(null);
    setFormData(emptyProductFormData);
    setSelectedStaffIds([]);
  };

  // Save staff assignments for a product (called after product save)
  const saveStaffAssignments = async (productId: string) => {
    try {
      await fetch('/api/staff-services', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, staffIds: selectedStaffIds }),
      });
    } catch (err) {
      console.error('Failed to save staff assignments', err);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingProduct) return;
    try {
      // Delete associated images from storage
      if (deletingProduct.images && deletingProduct.images.length > 0) {
        Promise.all(deletingProduct.images.map(img => deleteImage(img))).catch(console.error);
      }

      await fetch(`/api/products/${deletingProduct.id}`, { method: "DELETE" });
      setProducts(prev => prev.filter(p => p.id !== deletingProduct.id));
    } catch (err) {
      console.error("Failed to delete product", err);
    }
    setDeleteDialogOpen(false);
    setDeletingProduct(null);
  };

  // ─── Reorder Handlers ──────────────────────────────────────────────────────

  const moveProduct = async (productId: string, direction: "up" | "down") => {
    const idx = products.findIndex(p => p.id === productId);
    if (idx === -1) return;
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === products.length - 1) return;

    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    const newProducts = [...products];
    [newProducts[idx], newProducts[swapIdx]] = [newProducts[swapIdx], newProducts[idx]];
    setProducts(newProducts);

    // Persist the new order to the database
    try {
      await fetch("/api/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds: newProducts.map(p => p.id) }),
      });
    } catch (err) {
      console.error("Failed to save product order", err);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    try {
      setIsUploading(true);
      const url = await uploadImage(file, 'saloon_uploads', 'products');
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, url]
      }));
    } catch (err) {
      console.error("Failed to upload image", err);
    } finally {
      setIsUploading(false);
    }
  };

  // ─── Category Handlers ────────────────────────────────────────────────────

  const handleOpenAddCategory = () => {
    setEditingCategory(null);
    setCategoryFormData(emptyCategoryFormData);
  };

  const handleOpenEditCategory = (cat: CategoryItem) => {
    setEditingCategory(cat);
    setCategoryFormData({
      label: cat.label,
      color: cat.color,
      image: cat.image || "",
    });
  };

  const handleSaveCategory = async () => {
    try {
      if (editingCategory) {
        // Update existing category via API
        await fetch(`/api/categories/${editingCategory.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ label: categoryFormData.label, color: categoryFormData.color, image: categoryFormData.image }),
        });
      } else {
        // Create new category via API
        await fetch("/api/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ label: categoryFormData.label, color: categoryFormData.color, image: categoryFormData.image, type: typeFilter }),
        });
      }
      await fetchCategories();
    } catch (err) {
      console.error("Failed to save category", err);
    }
    setEditingCategory(null);
    setCategoryFormData(emptyCategoryFormData);
  };

  const handleOpenDeleteCategory = (cat: CategoryItem) => {
    setDeletingCategory(cat);
    setDeleteCategoryDialogOpen(true);
  };

  const handleConfirmDeleteCategory = async () => {
    if (!deletingCategory) return;
    try {
      await fetch(`/api/categories/${deletingCategory.id}`, { method: "DELETE" });
      await fetchCategories();
      await fetchProducts(); // Re-fetch products since their category may have been cleared
    } catch (err) {
      console.error("Failed to delete category", err);
    }
    if (activeCategory === deletingCategory.id) {
      setActiveCategory("all");
    }
    setDeleteCategoryDialogOpen(false);
    setDeletingCategory(null);
  };

  // ─── Category Pills ──────────────────────────────────────────────────────

  const categoryPills = useMemo(() => {
    const pills: { key: string; label: string; cat?: CategoryItem }[] = [
      { key: "all", label: t(locale, "catalog.allCategories") },
    ];
    categories.forEach((cat) => {
      pills.push({
        key: cat.id,
        label: cat.label,
        cat,
      });
    });
    if (hasUncategorized) {
      pills.push({
        key: "uncategorized",
        label: t(locale, "catalog.uncategorized"),
      });
    }
    return pills;
  }, [categories, rtl, locale, hasUncategorized]);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6" dir={rtl ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="space-y-4">
        <div className="space-y-1">
          <h2 className={cn("text-2xl font-bold tracking-tight", rtl && "font-arabic")}>
            {isServices ? t(locale, "services.title") : t(locale, "productsSection.title")}
          </h2>
          <p className={cn("text-muted-foreground text-sm", rtl && "font-arabic")}>
            {isServices ? t(locale, "services.subtitle") : t(locale, "productsSection.subtitle")}
          </p>
        </div>

        {/* Search + Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 min-w-0">
            <Search
              className={cn(
                "absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground",
                rtl ? "right-3" : "left-3"
              )}
            />
            <Input
              placeholder={t(locale, "search")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                rtl ? "pr-9 pl-3" : "pl-9 pr-3",
                rtl && "font-arabic"
              )}
            />
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setCategoryDialogOpen(true);
              handleOpenAddCategory();
            }}
            className={cn("gap-2 shrink-0", rtl && "font-arabic")}
          >
            <Settings2 className="w-4 h-4" />
            {t(locale, "catalog.manageCategories")}
          </Button>
          <Button
            onClick={handleOpenAdd}
            className={cn("gap-2 shrink-0", rtl && "font-arabic")}
          >
            <Plus className="w-4 h-4" />
            {isServices ? t(locale, "services.addService") : t(locale, "productsSection.addProduct")}
          </Button>
        </div>

        {/* Branch Filter */}
        {branches.length > 0 && (
          <div className="flex items-center gap-2">
            <Label className={cn("text-sm whitespace-nowrap", rtl && "font-arabic")}>
              {rtl ? "الفرع" : "Branch"}
            </Label>
            <Select value={filterBranch} onValueChange={setFilterBranch}>
              <SelectTrigger className={cn("w-[200px]", rtl && "font-arabic")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className={cn(rtl && "font-arabic")}>
                  {rtl ? "جميع الفروع" : "All Branches"}
                </SelectItem>
                <SelectItem value="unassigned" className={cn(rtl && "font-arabic")}>
                  {rtl ? "بدون فرع" : "Unassigned"}
                </SelectItem>
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id} className={cn(rtl && "font-arabic")}>
                    {rtl ? branch.nameAr || branch.name : branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap gap-2">
        {categoryPills.map((pill) => {
          const isActive = activeCategory === pill.key;
          const colors = pill.cat && isActive
            ? colorMap[pill.cat.color]
            : null;

          return (
            <button
              key={pill.key}
              onClick={() => setActiveCategory(pill.key)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all duration-200",
                isActive
                  ? colors
                    ? cn(colors.activeBg, colors.activeText, colors.activeBorder)
                    : pill.key === "uncategorized"
                      ? cn(neutralStyles.activeBg, neutralStyles.activeText, neutralStyles.activeBorder)
                      : "bg-primary/10 text-primary border-primary/30"
                  : "bg-background text-muted-foreground border-border hover:bg-muted hover:text-foreground",
                rtl && "font-arabic"
              )}
            >
              {pill.key !== "all" && (
                <Tag className="w-3.5 h-3.5" />
              )}
              {pill.label}
            </button>
          );
        })}
      </div>

      {/* Product Grid */}
      {filteredProducts.length === 0 ? (
        <div className={cn("flex flex-col items-center justify-center py-16 text-muted-foreground", rtl && "font-arabic")}>
          <Package className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-sm">{t(locale, "noData")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product) => {
            const cat = getCategoryById(product.category);
            const isUncategorized = !product.category || !cat;

            return (
              <Card
                key={product.id}
                className={cn(
                  "py-0 overflow-hidden group hover:shadow-md transition-shadow duration-200",
                  !product.isAvailable && "opacity-75"
                )}
              >
                {/* Image Placeholder */}
                <div
                  className={cn(
                    "relative h-40 flex items-center justify-center",
                    isUncategorized
                      ? neutralStyles.iconBg
                      : getCategoryStyles(cat, "iconBg")
                  )}
                >
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package
                      className={cn(
                        "w-12 h-12",
                        isUncategorized
                          ? "text-gray-500 dark:text-gray-400"
                          : getCategoryStyles(cat, "text")
                      )}
                    />
                  )}

                  {/* Availability Badge */}
                  <div className={cn("absolute top-2", rtl ? "right-2" : "left-2")}>
                    {product.isAvailable ? (
                      <Badge
                        variant="outline"
                        className={cn(
                          "gap-1 text-[10px] font-medium border",
                          "bg-sage-50 dark:bg-sage-900/20",
                          "text-sage-700 dark:text-sage-400",
                          "border-sage-200 dark:border-sage-800/40"
                        )}
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        {t(locale, "available")}
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className={cn(
                          "gap-1 text-[10px] font-medium border",
                          "bg-red-50 dark:bg-red-900/20",
                          "text-red-600 dark:text-red-400",
                          "border-red-200 dark:border-red-800/40"
                        )}
                      >
                        <XCircle className="w-3 h-3" />
                        {t(locale, "unavailable")}
                      </Badge>
                    )}
                  </div>

                  {/* Category Badge */}
                  <div className={cn("absolute top-2", rtl ? "left-2" : "right-2")}>
                    <Badge
                      variant="outline"
                      className={cn(
                        "gap-1 text-[10px] font-medium border",
                        isUncategorized
                          ? cn(neutralStyles.bg, neutralStyles.text, neutralStyles.border)
                          : cn(
                              getCategoryStyles(cat, "bg"),
                              getCategoryStyles(cat, "text"),
                              getCategoryStyles(cat, "border")
                            )
                      )}
                    >
                      {isUncategorized ? t(locale, "catalog.uncategorized") : getCategoryLabel(product.category)}
                    </Badge>
                  </div>
                </div>

                <CardContent className="p-4 space-y-3">
                  {/* Name & Price */}
                  <div>
                    <h3 className={cn("font-semibold text-sm leading-tight line-clamp-1", rtl && "font-arabic")}>
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-sm font-bold text-primary tabular-nums">
                        {product.price}
                      </span>
                      <span className={cn("text-xs text-muted-foreground", rtl && "font-arabic")}>
                        {rtl ? "د.أ" : "JOD"}
                      </span>
                    </div>
                  </div>

                  {/* Branch Badge */}
                  {product.Branch && (
                    <Badge variant="secondary" className={cn("text-[10px]", rtl && "font-arabic")}>
                      {rtl ? product.Branch.nameAr || product.Branch.name : product.Branch.name}
                    </Badge>
                  )}

                  {/* Description Snippet */}
                  <p className={cn("text-xs text-muted-foreground line-clamp-2 leading-relaxed", rtl && "font-arabic")}>
                    {product.description}
                  </p>

                  {/* Actions */}
                  <div className="flex items-center gap-1 pt-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => moveProduct(product.id, "up")}
                      title={rtl ? "تحريك لأعلى" : "Move up"}
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => moveProduct(product.id, "down")}
                      title={rtl ? "تحريك لأسفل" : "Move down"}
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </Button>
                    <div className="flex-1" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEdit(product)}
                      className={cn("gap-1.5 text-xs h-8", rtl && "font-arabic")}
                    >
                      <Pencil className="w-3 h-3" />
                      {t(locale, "edit")}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDelete(product)}
                      className={cn(
                        "gap-1.5 text-xs h-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 border-red-200 dark:border-red-800/40",
                        rtl && "font-arabic"
                      )}
                    >
                      <Trash2 className="w-3 h-3" />
                      {t(locale, "delete")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add/Edit Product Dialog */}
      <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
        <DialogContent
          className={cn("sm:max-w-lg", rtl && "font-arabic")}
          dir={rtl ? "rtl" : "ltr"}
        >
          <DialogHeader className={cn(rtl && "text-right")}>
            <DialogTitle className={cn(rtl && "text-right")}>
              {editingProduct
                ? isServices ? t(locale, "services.editService") : t(locale, "productsSection.editProduct")
                : isServices ? t(locale, "services.addService") : t(locale, "productsSection.addProduct")}
            </DialogTitle>
            <DialogDescription className={cn(rtl && "text-right")}>
              {editingProduct
                ? rtl
                  ? isServices ? "قم بتعديل تفاصيل الخدمة" : "قم بتعديل تفاصيل المنتج"
                  : isServices ? "Update service details" : "Update product details"
                : rtl
                  ? isServices ? "أضف خدمة جديدة" : "أضف منتج جديد"
                  : isServices ? "Add a new service" : "Add a new product"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto px-1 custom-scrollbar">
            {/* Arabic Name (Primary) */}
            <div className="space-y-2">
              <Label className="text-right block font-arabic" htmlFor="name">
                {t(locale, "catalog.productName")}
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="اسم المنتج أو الخدمة"
                className="text-right font-arabic"
                dir="rtl"
              />
            </div>

            {/* Arabic Description (Primary) */}
            <div className="space-y-2">
              <Label className="text-right block font-arabic" htmlFor="description">
                {t(locale, "catalog.productDescription")}
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="تفاصيل المنتج أو الخدمة"
                rows={3}
                className="text-right font-arabic"
                dir="rtl"
              />
            </div>

            {/* Price & Category Row */}
            <div className="grid grid-cols-2 gap-3">
              {/* Price */}
              <div className="space-y-2">
                <Label className={cn(rtl && "text-right")} htmlFor="price">
                  {t(locale, "catalog.productPrice")}
                </Label>
                <Input
                  id="price"
                  type="text"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, price: e.target.value }))
                  }
                  placeholder={rtl ? "مثال: 10 أو حسب الطلب" : "e.g. 10 or Varies"}
                  className="tabular-nums"
                  dir="ltr"
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label className={cn(rtl && "text-right")}>
                  {t(locale, "catalog.productCategory")}
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(val) =>
                    setFormData((prev) => ({
                      ...prev,
                      category: val,
                    }))
                  }
                >
                  <SelectTrigger className={cn("w-full", rtl && "font-arabic")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem
                        key={cat.id}
                        value={cat.id}
                        className={rtl ? "font-arabic" : ""}
                      >
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Branch Selector */}
            {branches.length > 0 && (
              <div className="space-y-2">
                <Label className={cn(rtl && "text-right block font-arabic")}>
                  {rtl ? "الفرع" : "Branch"}
                </Label>
                <Select
                  value={formData.branchId}
                  onValueChange={(val) =>
                    setFormData((prev) => ({ ...prev, branchId: val }))
                  }
                >
                  <SelectTrigger className={cn("w-full", rtl && "font-arabic")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" className={cn(rtl && "font-arabic")}>
                      {rtl ? "بدون فرع" : "No Branch"}
                    </SelectItem>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id} className={cn(rtl && "font-arabic")}>
                        {rtl ? branch.nameAr || branch.name : branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Location Availability Toggles — Services only */}
            {isServices && (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/30">
                <Label className={cn("cursor-pointer", rtl && "font-arabic")} htmlFor="availableAtSalon">
                  {rtl ? "متوفر في الصالون" : "Available at Salon"}
                </Label>
                <div dir="ltr" className="flex items-center">
                  <Switch
                    id="availableAtSalon"
                    checked={formData.availableAtSalon}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, availableAtSalon: checked }))
                    }
                  />
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/30">
                <Label className={cn("cursor-pointer", rtl && "font-arabic")} htmlFor="availableAtHome">
                  {rtl ? "متوفر في المنزل" : "Available at Home"}
                </Label>
                <div dir="ltr" className="flex items-center">
                  <Switch
                    id="availableAtHome"
                    checked={formData.availableAtHome}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, availableAtHome: checked }))
                    }
                  />
                </div>
              </div>
            </div>
            )}

            {/* Stock — Products only */}
            {!isServices && (
            <div className="space-y-2">
              <Label className={cn(rtl && "text-right block font-arabic")} htmlFor="stock">
                {rtl ? "الكمية المتوفرة" : "Stock Quantity"}
              </Label>
              <Input
                id="stock"
                type="number"
                min="0"
                value={formData.stock ?? 0}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, stock: parseInt(e.target.value) || 0 }))
                }
                placeholder="0"
                className="tabular-nums"
                dir="ltr"
              />
            </div>
            )}

            {/* Image Upload */}
            <div className="space-y-3">
              <Label className={cn("block", rtl && "text-right font-arabic")}>
                {rtl ? "صور المنتج" : "Product Images"}
              </Label>
              
              {/* Image Preview Grid */}
              {formData.images.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.images.map((img, idx) => (
                    <div key={idx} className="relative w-16 h-16 rounded-md overflow-hidden border">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          const imgToRemove = formData.images[idx];
                          // If it's a newly uploaded image (not in the original product), delete it immediately to prevent orphans
                          if (!editingProduct?.images?.includes(imgToRemove)) {
                            deleteImage(imgToRemove).catch(console.error);
                          }
                          setFormData(prev => ({
                            ...prev,
                            images: prev.images.filter((_, i) => i !== idx)
                          }))
                        }}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                      >
                        <XCircle className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Button */}
              <div className="relative">
                <input
                  type="file"
                  id="image-upload"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                  disabled={isUploading}
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  className={cn("w-full gap-2", rtl && "font-arabic")}
                  onClick={() => document.getElementById('image-upload')?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  {rtl ? "إضافة صورة" : "Add Image"}
                </Button>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label className={cn("block", rtl && "text-right font-arabic")} htmlFor="notes">
                {rtl ? "ملاحظات إضافية" : "Additional Notes"}
              </Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    notes: e.target.value,
                  }))
                }
                placeholder={rtl ? "ملاحظات للاستخدام الداخلي (لن تظهر للعميل)" : "Internal notes (hidden from customers)"}
                rows={2}
                className={cn(rtl && "text-right font-arabic")}
                dir={rtl ? "rtl" : "ltr"}
              />
            </div>

            {/* ─── Service-Only Fields (Duration, Mode, Deposit, Publish) ─── */}
            {isServices && (
              <>
                {/* Duration & Mode */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className={cn("block", rtl && "text-right font-arabic")}>
                      {t(locale, "services.duration")}
                    </Label>
                    <Select
                      value={String(formData.durationMinutes)}
                      onValueChange={(v) => setFormData(prev => ({ ...prev, durationMinutes: parseInt(v) }))}
                    >
                      <SelectTrigger className={cn(rtl && "font-arabic")}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DURATION_OPTIONS.map((d) => (
                          <SelectItem key={d} value={String(d)}>
                            {d >= 60 ? `${d / 60} ${rtl ? 'ساعة' : 'hr'}` : `${d} ${rtl ? 'دقيقة' : 'min'}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className={cn("block", rtl && "text-right font-arabic")}>
                      {t(locale, "services.bookingMode")}
                    </Label>
                    <Select
                      value={formData.durationMode}
                      onValueChange={(v: 'time' | 'queue') => setFormData(prev => ({ ...prev, durationMode: v }))}
                    >
                      <SelectTrigger className={cn(rtl && "font-arabic")}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="time" className={cn(rtl && "font-arabic")}>
                          {t(locale, "services.byTime")}
                        </SelectItem>
                        <SelectItem value="queue" className={cn(rtl && "font-arabic")}>
                          {t(locale, "services.byQueue")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Deposit & Publish Timing */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className={cn("block", rtl && "text-right font-arabic")}>
                      {t(locale, "services.deposit")}
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      step={0.5}
                      value={formData.depositAmount}
                      onChange={(e) => setFormData(prev => ({ ...prev, depositAmount: parseFloat(e.target.value) || 0 }))}
                      dir="ltr"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className={cn("block", rtl && "text-right font-arabic")}>
                      {t(locale, "services.publishTiming")}
                    </Label>
                    <Select
                      value={formData.publishAt}
                      onValueChange={(v) => setFormData(prev => ({ ...prev, publishAt: v }))}
                    >
                      <SelectTrigger className={cn(rtl && "font-arabic")}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PUBLISH_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value || 'now'} value={opt.value || 'now'} className={cn(rtl && "font-arabic")}>
                            {rtl ? opt.labelAr : opt.labelEn}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}

            {/* ─── Staff Assignment (Services only) ─── */}
            {isServices && (
              <div className="space-y-2">
                <Label className={cn("block", rtl && "text-right font-arabic")}>
                  {t(locale, "services.assignedStaff")}
                </Label>
                <div className="border rounded-lg p-3 max-h-40 overflow-y-auto space-y-2">
                  {(formData.branchId !== "none"
                    ? allStaff.filter(s => s.branchId === formData.branchId)
                    : allStaff
                  ).length > 0 ? (
                    (formData.branchId !== "none"
                      ? allStaff.filter(s => s.branchId === formData.branchId)
                      : allStaff
                    ).map(s => (
                      <label key={s.id} className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 rounded-md p-1.5 transition-colors">
                        <input
                          type="checkbox"
                          checked={selectedStaffIds.includes(s.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedStaffIds(prev => [...prev, s.id]);
                            } else {
                              setSelectedStaffIds(prev => prev.filter(id => id !== s.id));
                            }
                          }}
                          className="w-4 h-4 rounded border-gray-300 text-sage-600 focus:ring-sage-500"
                        />
                        <span className={cn("text-sm", rtl && "font-arabic")}>{s.name}</span>
                      </label>
                    ))
                  ) : (
                    <p className={cn("text-sm text-muted-foreground text-center py-2", rtl && "font-arabic")}>
                      {t(locale, "services.noStaffAvailable")}
                    </p>
                  )}
                </div>
                {selectedStaffIds.length > 0 && (
                  <p className={cn("text-xs text-muted-foreground", rtl && "text-right font-arabic")}>
                    {selectedStaffIds.length} {rtl ? "عاملة مختارة" : "staff selected"}
                  </p>
                )}
              </div>
            )}

            {/* Availability Toggle */}
            <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/30">
              <Label className={cn("cursor-pointer", rtl && "font-arabic")} htmlFor="availability">
                {t(locale, "catalog.availability")}
              </Label>
              <div className="flex items-center gap-3" dir="ltr">
                <span
                  className={cn(
                    "text-xs font-medium",
                    formData.isAvailable
                      ? "text-sage-600 dark:text-sage-400"
                      : "text-red-500 dark:text-red-400",
                    rtl && "font-arabic"
                  )}
                >
                  {formData.isAvailable ? t(locale, "available") : t(locale, "unavailable")}
                </span>
                <Switch
                  id="availability"
                  checked={formData.isAvailable}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, isAvailable: checked }))
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setProductDialogOpen(false)}
              className={rtl ? "font-arabic" : ""}
            >
              {t(locale, "cancel")}
            </Button>
            <Button
              onClick={handleSaveProduct}
              disabled={!formData.name.trim()}
              className={rtl ? "font-arabic" : ""}
            >
              {t(locale, "save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Product Confirmation AlertDialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent dir={rtl ? "rtl" : "ltr"}>
          <AlertDialogHeader className={cn(rtl && "text-right")}>
            <AlertDialogTitle className={cn(rtl && "font-arabic text-right")}>
              {t(locale, "catalog.deleteProduct")}
            </AlertDialogTitle>
            <AlertDialogDescription className={cn(rtl && "font-arabic text-right")}>
              {t(locale, "catalog.deleteConfirm")}
              {deletingProduct && (
                <span className="font-semibold block mt-1">
                  &quot;{deletingProduct.name}&quot;
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className={rtl ? "font-arabic" : ""}>
              {t(locale, "cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {t(locale, "delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Manage Categories Dialog */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent
          className={cn("sm:max-w-lg", rtl && "font-arabic")}
          dir={rtl ? "rtl" : "ltr"}
        >
          <DialogHeader className={cn(rtl && "text-right")}>
            <DialogTitle className={cn(rtl && "text-right")}>
              {t(locale, "catalog.manageCategories")}
            </DialogTitle>
            <DialogDescription className={cn(rtl && "text-right")}>
              {rtl
                ? "أضف أو عدّل أو احذف فئات المنتجات"
                : "Add, edit, or remove product categories"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto px-1 custom-scrollbar">
            {/* Add/Edit Category Form */}
            <div className="rounded-lg border p-4 space-y-3 bg-muted/30">
              <h4 className={cn("text-sm font-semibold", rtl && "font-arabic")}>
                {editingCategory ? t(locale, "catalog.editCategory") : t(locale, "catalog.addCategory")}
              </h4>

              <div className="grid grid-cols-2 gap-3">
                {/* Category Name */}
                <div className="space-y-1.5 col-span-2">
                  <Label className={cn("text-xs font-arabic", rtl && "text-right block")} htmlFor="catName">
                    {t(locale, "catalog.categoryName")}
                  </Label>
                  <Input
                    id="catName"
                    value={categoryFormData.label}
                    onChange={(e) =>
                      setCategoryFormData((prev) => ({ ...prev, label: e.target.value }))
                    }
                    placeholder={rtl ? "اسم الفئة" : "Category name"}
                    dir={rtl ? "rtl" : "ltr"}
                    className={cn("text-sm", rtl && "text-right font-arabic")}
                  />
                </div>
              </div>

              {/* Color Picker */}
              <div className="space-y-1.5">
                <Label className="text-xs">
                  {rtl ? "اللون" : "Color"}
                </Label>
                <div className="flex items-center gap-2">
                  {availableColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() =>
                        setCategoryFormData((prev) => ({ ...prev, color }))
                      }
                      className={cn(
                        "w-7 h-7 rounded-full transition-all duration-200 border-2",
                        colorCircleMap[color],
                        categoryFormData.color === color
                          ? "border-foreground scale-110 ring-2 ring-foreground/20"
                          : "border-transparent hover:scale-105"
                      )}
                      title={color}
                    />
                  ))}
                </div>
              </div>

              {/* Image Upload */}
              <div className="space-y-1.5">
                <Label className="text-xs">
                  {rtl ? "صورة الفئة" : "Category Image"}
                </Label>
                {categoryFormData.image ? (
                  <div className="relative w-full h-28 rounded-lg overflow-hidden border">
                    <img src={categoryFormData.image} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setCategoryFormData(prev => ({ ...prev, image: "" }))}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs hover:bg-red-600"
                    >✕</button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-28 rounded-lg border-2 border-dashed border-muted-foreground/25 cursor-pointer hover:border-muted-foreground/50 transition-colors">
                    <ImageIcon className="w-6 h-6 text-muted-foreground/40 mb-1" />
                    <span className="text-xs text-muted-foreground">{rtl ? "اختر صورة" : "Choose image"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        if (!e.target.files?.[0]) return;
                        try {
                          const url = await uploadImage(e.target.files[0], 'saloon_uploads', 'categories');
                          setCategoryFormData(prev => ({ ...prev, image: url }));
                        } catch (err) { console.error("Category image upload failed:", err); }
                      }}
                    />
                  </label>
                )}
              </div>

              {/* Save / Cancel buttons for the form */}
              <div className="flex items-center gap-2 pt-1">
                <Button
                  size="sm"
                  onClick={handleSaveCategory}
                  disabled={!categoryFormData.label.trim()}
                  className={cn("gap-1.5 text-xs", rtl && "font-arabic")}
                >
                  <Plus className="w-3 h-3" />
                  {editingCategory ? t(locale, "save") : t(locale, "add")}
                </Button>
                {editingCategory && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingCategory(null);
                      setCategoryFormData(emptyCategoryFormData);
                    }}
                    className={cn("text-xs", rtl && "font-arabic")}
                  >
                    {t(locale, "cancel")}
                  </Button>
                )}
              </div>
            </div>

            {/* Category List */}
            <div className="space-y-2">
              {categories.length === 0 ? (
                <p className={cn("text-sm text-muted-foreground text-center py-4", rtl && "font-arabic")}>
                  {rtl ? "لا توجد فئات بعد" : "No categories yet"}
                </p>
              ) : (
                categories.map((cat) => {
                  const catColor = colorMap[cat.color];
                  return (
                    <div
                      key={cat.id}
                      className={cn(
                        "flex items-center gap-3 rounded-lg border p-3 transition-colors",
                        catColor
                          ? cn(catColor.bg, catColor.border)
                          : cn(neutralStyles.bg, neutralStyles.border)
                      )}
                    >
                      {/* Color dot */}
                      <div
                        className={cn(
                          "w-3 h-3 rounded-full shrink-0",
                          colorCircleMap[cat.color] || "bg-gray-400"
                        )}
                      />

                      {/* Category label */}
                      <div className="flex-1 min-w-0">
                        <span className={cn("text-sm font-medium", catColor ? catColor.text : neutralStyles.text)}>
                          {cat.label}
                        </span>
                      </div>

                      {/* Product count */}
                      <span className={cn("text-xs text-muted-foreground tabular-nums shrink-0", rtl && "font-arabic")}>
                        {products.filter((p) => p.category === cat.id).length}
                      </span>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEditCategory(cat)}
                          className="gap-1 text-xs h-7 w-7 p-0"
                        >
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDeleteCategory(cat)}
                          className="gap-1 text-xs h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCategoryDialogOpen(false);
                setEditingCategory(null);
                setCategoryFormData(emptyCategoryFormData);
              }}
              className={rtl ? "font-arabic" : ""}
            >
              {t(locale, "close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Category Confirmation AlertDialog */}
      <AlertDialog open={deleteCategoryDialogOpen} onOpenChange={setDeleteCategoryDialogOpen}>
        <AlertDialogContent dir={rtl ? "rtl" : "ltr"}>
          <AlertDialogHeader className={cn(rtl && "text-right")}>
            <AlertDialogTitle className={cn(rtl && "font-arabic text-right")}>
              {t(locale, "catalog.deleteCategory")}
            </AlertDialogTitle>
            <AlertDialogDescription className={cn(rtl && "font-arabic text-right")}>
              {t(locale, "catalog.deleteCategoryConfirm")}
              {deletingCategory && (
                <span className="font-semibold block mt-1">
                  &quot;{deletingCategory.label}&quot;
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className={rtl ? "font-arabic" : ""}>
              {t(locale, "cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteCategory}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {t(locale, "delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
