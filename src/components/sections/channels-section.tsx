"use client";

import { toast } from "sonner";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { useAppStore } from "@/lib/store";
import { t, isRTL } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  Camera,
  Plus,
  Trash2,
  Key,
  Variable,
  ImageIcon,
  Wifi,
  WifiOff,
  Pencil,
  Eye,
  EyeOff,
  Loader2,
  Save,
  ChevronDown,
} from "lucide-react";
import { uploadImage, deleteImage } from "@/lib/storage";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

// ─── Types ────────────────────────────────────────────────────────────────────

type ChannelType = "whatsapp" | "facebook" | "instagram";

interface Credential {
  key: string;
  value: string;
}

interface Variable {
  name: string;
  value: string;
}

interface ImageSet {
  name: string;
  urls: string[];
}

export interface Channel {
  id: string;
  name: string;
  type: ChannelType;
  isActive: boolean;
  credentials: Credential[];
  variables: Variable[];
  imageSets: ImageSet[];
  webhookUrl?: string;
}

// ─── Channel Type Config ──────────────────────────────────────────────────────

const channelTypeConfig: Record<
  ChannelType,
  {
    label: string;
    labelAr: string;
    icon: typeof MessageCircle;
    bgColor: string;
    textColor: string;
    borderColor: string;
    iconBg: string;
    accentBorder: string;
  }
> = {
  whatsapp: {
    label: "WhatsApp",
    labelAr: "واتساب",
    icon: MessageCircle,
    bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
    textColor: "text-emerald-700 dark:text-emerald-400",
    borderColor: "border-emerald-200 dark:border-emerald-800/40",
    iconBg: "bg-emerald-100 dark:bg-emerald-800/30",
    accentBorder: "border-l-emerald-500 dark:border-l-emerald-400",
  },
  facebook: {
    label: "Facebook",
    labelAr: "ماسنجر",
    icon: MessageCircle,
    bgColor: "bg-sky-50 dark:bg-sky-900/20",
    textColor: "text-sky-700 dark:text-sky-400",
    borderColor: "border-sky-200 dark:border-sky-800/40",
    iconBg: "bg-sky-100 dark:bg-sky-800/30",
    accentBorder: "border-l-sky-500 dark:border-l-sky-400",
  },
  instagram: {
    label: "Instagram",
    labelAr: "انستجرام",
    icon: Camera,
    bgColor: "bg-pink-50 dark:bg-pink-900/20",
    textColor: "text-pink-700 dark:text-pink-400",
    borderColor: "border-pink-200 dark:border-pink-800/40",
    iconBg: "bg-pink-100 dark:bg-pink-800/30",
    accentBorder: "border-l-pink-500 dark:border-l-pink-400",
  },
};

// ─── Accent colors per section ────────────────────────────────────────────────

const sectionAccents = {
  credentials: {
    iconColor: "text-terracotta-600 dark:text-terracotta-400",
    badgeBg: "bg-terracotta-50 dark:bg-terracotta-900/20",
    badgeText: "text-terracotta-700 dark:text-terracotta-400",
    badgeBorder: "border-terracotta-200 dark:border-terracotta-800/40",
    dotColor: "bg-terracotta-500",
  },
  variables: {
    iconColor: "text-sage-600 dark:text-sage-400",
    badgeBg: "bg-sage-50 dark:bg-sage-900/20",
    badgeText: "text-sage-700 dark:text-sage-400",
    badgeBorder: "border-sage-200 dark:border-sage-800/40",
    dotColor: "bg-sage-500",
  },
  imageSets: {
    iconColor: "text-amber-600 dark:text-amber-400",
    badgeBg: "bg-amber-50 dark:bg-amber-900/20",
    badgeText: "text-amber-700 dark:text-amber-400",
    badgeBorder: "border-amber-200 dark:border-amber-800/40",
    dotColor: "bg-amber-500",
  },
};

// ─── Helper ───────────────────────────────────────────────────────────────────

const PROTECTED_VARIABLES = ["delay", "bot-on", "bot-off"];
const PROTECTED_WHATSAPP_CREDENTIALS = ["evolution_api"];

function createEmptyChannelForm(): Omit<Channel, "id"> {
  return {
    name: "",
    type: "whatsapp",
    isActive: true,
    credentials: [{ key: "evolution_api", value: "" }],
    variables: [
      { name: "delay", value: "15" },
      { name: "bot-on", value: "**" },
      { name: "bot-off", value: "##" }
    ],
    imageSets: [{ name: "", urls: [""] }],
    webhookUrl: "",
  };
}

function deepCloneChannel(ch: Channel): Omit<Channel, "id"> {
  const vars = ch.variables.map((v) => ({ ...v }));
  const creds = ch.credentials.map((c) => ({ ...c }));

  if (ch.type === "whatsapp") {
    if (!creds.find(c => c.key.trim().toLowerCase() === "evolution_api")) {
      creds.unshift({ key: "evolution_api", value: "" });
    }
  }
  
  // Ensure protected variables exist
  const protectedDefaults = [
    { name: "delay", value: "15" },
    { name: "bot-on", value: "**" },
    { name: "bot-off", value: "##" }
  ];
  
  protectedDefaults.forEach(pd => {
    if (!vars.find(v => v.name === pd.name)) {
      vars.push({ ...pd });
    }
  });

  return {
    name: ch.name,
    type: ch.type,
    isActive: ch.isActive,
    credentials: creds,
    variables: vars,
    imageSets: ch.imageSets.map((s) => ({ ...s, urls: [...s.urls] })),
    webhookUrl: ch.webhookUrl || "",
  };
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ChannelsSection() {
  const { locale, userRole } = useAppStore();
  const rtl = isRTL(locale);

  const [channels, setChannels] = useState<Channel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [formData, setFormData] = useState<Omit<Channel, "id">>(
    createEmptyChannelForm()
  );
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchChannels = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/channels");
      const data = await res.json();
      
      const formattedChannels = (Array.isArray(data) ? data : []).map(ch => {
        let varsArray: { name: string; value: string }[] = [];
        if (Array.isArray(ch.variables)) {
          varsArray = ch.variables;
        } else if (typeof ch.variables === 'object' && ch.variables !== null) {
          varsArray = Object.entries(ch.variables).map(([name, value]) => ({ name, value: String(value) }));
        }
        if (varsArray.length === 0) varsArray = [{ name: "", value: "" }];
        
        let credsArray: { key: string; value: string }[] = [];
        if (Array.isArray(ch.credentials)) {
          credsArray = ch.credentials;
        } else if (typeof ch.credentials === 'object' && ch.credentials !== null) {
          credsArray = Object.entries(ch.credentials).map(([key, value]) => ({ key, value: String(value) }));
        }
        
        if (ch.type === "whatsapp" && !credsArray.find(c => c.key.trim().toLowerCase() === "evolution_api")) {
          credsArray.unshift({ key: "evolution_api", value: "" });
        }

        if (credsArray.length === 0) credsArray = [{ key: "", value: "" }];
        
        let imgsArray: { name: string; urls: string[] }[] = Array.isArray(ch.imageSets) ? ch.imageSets : [];
        if (imgsArray.length === 0) imgsArray = [{ name: "", urls: [""] }];

        return {
          ...ch,
          variables: varsArray,
          credentials: credsArray,
          imageSets: imgsArray
        };
      });
      
      setChannels(formattedChannels);
    } catch (err) {
      console.error("Failed to fetch channels", err);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchChannels();
  }, []);

  // ─── Dialog Handlers ─────────────────────────────────────────────────────

  const openAddDialog = useCallback(() => {
    setEditingChannel(null);
    setFormData(createEmptyChannelForm());
    setDialogOpen(true);
  }, []);

  const openEditDialog = useCallback((channel: Channel) => {
    setEditingChannel(channel);
    setFormData(deepCloneChannel(channel));
    setDialogOpen(true);
  }, []);

  const handleDialogClose = useCallback(
    (open: boolean) => {
      if (!open) {
        setDialogOpen(false);
        setEditingChannel(null);
      }
    },
    []
  );

  const handleSave = async () => {
    if (!formData.name.trim()) return;

    const cleanedCredentialsObj = formData.credentials.reduce((acc, c) => {
      if (c.key.trim()) {
        acc[c.key.trim()] = c.value;
      }
      return acc;
    }, {} as Record<string, string>);
    const cleanedVariablesObj = formData.variables.reduce((acc, v) => {
      if (v.name.trim()) {
        acc[v.name.trim()] = v.value;
      }
      return acc;
    }, {} as Record<string, string>);

    const cleanedImageSets = formData.imageSets
      .map((s) => ({ ...s, urls: s.urls.filter((u) => u && u.trim() !== "") }))
      .filter((s) => s.urls.length > 0 || s.name.trim());

    const payload = {
      name: formData.name,
      type: formData.type,
      isActive: formData.isActive,
      credentials: cleanedCredentialsObj,
      variables: cleanedVariablesObj,
      imageSets: cleanedImageSets,
      webhookUrl: formData.webhookUrl,
    };

    try {
      if (editingChannel) {
        await fetch(`/api/channels/${editingChannel.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch("/api/channels", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      fetchChannels();
      toast.success("تم حفظ الاعدادات");
    } catch (error) {
      console.error("Failed to save channel", error);
      toast.error("فشل في حفظ الاعدادات");
    }

    setDialogOpen(false);
    setEditingChannel(null);
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/channels/${id}`, { method: "DELETE" });
      fetchChannels();
      toast.success("تم حذف القناة");
    } catch (error) {
      console.error("Failed to delete channel", error);
      toast.error("فشل في حذف القناة");
    }
    setDeleteConfirmId(null);
  };

  const toggleChannelActive = async (id: string) => {
    const channel = channels.find((ch) => ch.id === id);
    if (!channel) return;

    // Optimistic UI update
    setChannels((prev) =>
      prev.map((ch) => (ch.id === id ? { ...ch, isActive: !ch.isActive } : ch))
    );

    try {
      await fetch(`/api/channels/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !channel.isActive }),
      });
    } catch (error) {
      console.error("Failed to toggle channel status", error);
      fetchChannels();
    }
  };

  const [savingChannelId, setSavingChannelId] = useState<string | null>(null);

  const saveChannelInline = async (channel: Channel) => {
    setSavingChannelId(channel.id);
    try {
      const cleanedCredentialsObj = channel.credentials.reduce((acc, c) => {
        if (c.key.trim()) {
          acc[c.key.trim()] = c.value;
        }
        return acc;
      }, {} as Record<string, string>);
      const cleanedVariablesObj = channel.variables.reduce((acc, v) => {
        if (v.name.trim()) {
          acc[v.name.trim()] = v.value;
        }
        return acc;
      }, {} as Record<string, string>);
      
      const cleanedImageSets = channel.imageSets
        .map((s) => ({ ...s, urls: s.urls.filter((u) => u && u.trim() !== "") }))
        .filter((s) => s.urls.length > 0 || s.name.trim());

      const payload = {
        name: channel.name,
        type: channel.type,
        isActive: channel.isActive,
        credentials: cleanedCredentialsObj,
        variables: cleanedVariablesObj,
        imageSets: cleanedImageSets,
        webhookUrl: channel.webhookUrl,
      };

      await fetch(`/api/channels/${channel.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      toast.success("تم حفظ الاعدادات");
    } catch (error) {
      console.error("Failed to save channel inline", error);
      toast.error("فشل في حفظ الاعدادات");
    } finally {
      setSavingChannelId(null);
    }
  };

  // ─── Form Data Helpers ───────────────────────────────────────────────────

  const updateFormCredential = useCallback(
    (index: number, field: "key" | "value", val: string) => {
      setFormData((prev) => {
        const creds = [...prev.credentials];
        creds[index] = { ...creds[index], [field]: val };
        return { ...prev, credentials: creds };
      });
    },
    []
  );

  const addFormCredential = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      credentials: [...prev.credentials, { key: "", value: "" }],
    }));
  }, []);

  const removeFormCredential = useCallback((index: number) => {
    setFormData((prev) => {
      const c = prev.credentials[index];
      if (prev.type === "whatsapp" && c && c.key.trim().toLowerCase() === "evolution_api") {
        return prev;
      }
      return {
        ...prev,
        credentials: prev.credentials.filter((_, i) => i !== index),
      };
    });
  }, []);

  const updateFormVariable = useCallback(
    (index: number, field: "name" | "value", val: string) => {
      setFormData((prev) => {
        const vars = [...prev.variables];
        vars[index] = { ...vars[index], [field]: val };
        return { ...prev, variables: vars };
      });
    },
    []
  );

  const addFormVariable = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      variables: [...prev.variables, { name: "", value: "" }],
    }));
  }, []);

  const removeFormVariable = useCallback((index: number) => {
    setFormData((prev) => {
      const v = prev.variables[index];
      if (v && PROTECTED_VARIABLES.includes(v.name.trim().toLowerCase())) {
        return prev;
      }
      return {
        ...prev,
        variables: prev.variables.filter((_, i) => i !== index),
      };
    });
  }, []);

  const updateFormImageSetName = useCallback(
    (setIndex: number, val: string) => {
      setFormData((prev) => {
        const sets = [...prev.imageSets];
        sets[setIndex] = { ...sets[setIndex], name: val };
        return { ...prev, imageSets: sets };
      });
    },
    []
  );

  const updateFormImageSetUrl = useCallback(
    (setIndex: number, urlIndex: number, val: string) => {
      setFormData((prev) => {
        const sets = [...prev.imageSets];
        const urls = [...sets[setIndex].urls];
        urls[urlIndex] = val;
        sets[setIndex] = { ...sets[setIndex], urls };
        return { ...prev, imageSets: sets };
      });
    },
    []
  );

  const addFormImageSetUrl = useCallback((setIndex: number) => {
    setFormData((prev) => {
      const sets = [...prev.imageSets];
      sets[setIndex] = {
        ...sets[setIndex],
        urls: [...sets[setIndex].urls, ""],
      };
      return { ...prev, imageSets: sets };
    });
  }, []);

  const removeFormImageSetUrl = useCallback(
    (setIndex: number, urlIndex: number) => {
      setFormData((prev) => {
        const sets = [...prev.imageSets];
        sets[setIndex] = {
          ...sets[setIndex],
          urls: sets[setIndex].urls.filter((_, i) => i !== urlIndex),
        };
        return { ...prev, imageSets: sets };
      });
    },
    []
  );

  const addFormImageSet = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      imageSets: [...prev.imageSets, { name: "", urls: [""] }],
    }));
  }, []);

  const removeFormImageSet = useCallback((setIndex: number) => {
    setFormData((prev) => ({
      ...prev,
      imageSets: prev.imageSets.filter((_, i) => i !== setIndex),
    }));
  }, []);

  // ─── Inline Card State Update Helpers ────────────────────────────────────

  const updateChannelCredential = useCallback(
    (channelId: string, index: number, field: "key" | "value", val: string) => {
      setChannels((prev) =>
        prev.map((ch) => {
          if (ch.id !== channelId) return ch;
          const creds = [...ch.credentials];
          creds[index] = { ...creds[index], [field]: val };
          return { ...ch, credentials: creds };
        })
      );
    },
    []
  );

  const addChannelCredential = useCallback((channelId: string) => {
    setChannels((prev) =>
      prev.map((ch) =>
        ch.id === channelId
          ? { ...ch, credentials: [...ch.credentials, { key: "", value: "" }] }
          : ch
      )
    );
  }, []);

  const removeChannelCredential = useCallback(
    (channelId: string, index: number) => {
      setChannels((prev) =>
        prev.map((ch) => {
          if (ch.id !== channelId) return ch;
          const c = ch.credentials[index];
          if (ch.type === "whatsapp" && c && c.key.trim().toLowerCase() === "evolution_api") {
            return ch;
          }
          return {
            ...ch,
            credentials: ch.credentials.filter((_, i) => i !== index),
          };
        })
      );
    },
    []
  );

  const updateChannelVariable = useCallback(
    (channelId: string, index: number, field: "name" | "value", val: string) => {
      setChannels((prev) =>
        prev.map((ch) => {
          if (ch.id !== channelId) return ch;
          const vars = [...ch.variables];
          vars[index] = { ...vars[index], [field]: val };
          return { ...ch, variables: vars };
        })
      );
    },
    []
  );

  const addChannelVariable = useCallback((channelId: string) => {
    setChannels((prev) =>
      prev.map((ch) =>
        ch.id === channelId
          ? { ...ch, variables: [...ch.variables, { name: "", value: "" }] }
          : ch
      )
    );
  }, []);

  const removeChannelVariable = useCallback(
    (channelId: string, index: number) => {
      setChannels((prev) =>
        prev.map((ch) => {
          if (ch.id !== channelId) return ch;
          const v = ch.variables[index];
          if (v && PROTECTED_VARIABLES.includes(v.name.trim().toLowerCase())) {
            return ch;
          }
          return {
            ...ch,
            variables: ch.variables.filter((_, i) => i !== index),
          };
        })
      );
    },
    []
  );

  const updateChannelImageSetName = useCallback(
    (channelId: string, setIndex: number, val: string) => {
      setChannels((prev) =>
        prev.map((ch) => {
          if (ch.id !== channelId) return ch;
          const sets = [...ch.imageSets];
          sets[setIndex] = { ...sets[setIndex], name: val };
          return { ...ch, imageSets: sets };
        })
      );
    },
    []
  );

  const updateChannelImageSetUrl = useCallback(
    (channelId: string, setIndex: number, urlIndex: number, val: string) => {
      setChannels((prev) =>
        prev.map((ch) => {
          if (ch.id !== channelId) return ch;
          const sets = [...ch.imageSets];
          const urls = [...sets[setIndex].urls];
          urls[urlIndex] = val;
          sets[setIndex] = { ...sets[setIndex], urls };
          return { ...ch, imageSets: sets };
        })
      );
    },
    []
  );

  const addChannelImageSetUrl = useCallback(
    (channelId: string, setIndex: number) => {
      setChannels((prev) =>
        prev.map((ch) => {
          if (ch.id !== channelId) return ch;
          const sets = [...ch.imageSets];
          sets[setIndex] = {
            ...sets[setIndex],
            urls: [...sets[setIndex].urls, ""],
          };
          return { ...ch, imageSets: sets };
        })
      );
    },
    []
  );

  const removeChannelImageSetUrl = useCallback(
    (channelId: string, setIndex: number, urlIndex: number) => {
      setChannels((prev) =>
        prev.map((ch) => {
          if (ch.id !== channelId) return ch;
          const sets = [...ch.imageSets];
          sets[setIndex] = {
            ...sets[setIndex],
            urls: sets[setIndex].urls.filter((_, i) => i !== urlIndex),
          };
          return { ...ch, imageSets: sets };
        })
      );
    },
    []
  );

  const removeChannelImageSet = useCallback(
    (channelId: string, setIndex: number) => {
      setChannels((prev) =>
        prev.map((ch) =>
          ch.id === channelId
            ? {
                ...ch,
                imageSets: ch.imageSets.filter((_, i) => i !== setIndex),
              }
            : ch
        )
      );
    },
    []
  );

  const addChannelImageSet = useCallback((channelId: string) => {
    setChannels((prev) =>
      prev.map((ch) =>
        ch.id === channelId
          ? { ...ch, imageSets: [...ch.imageSets, { name: "", urls: [""] }] }
          : ch
      )
    );
  }, []);

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6" dir={rtl ? "rtl" : "ltr"}>
      {/* Section Header */}
      <div
        className={cn(
          "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4",
          ""
        )}
      >
        <div className={cn("space-y-1", rtl && "text-right")}>
          <h2
            className={cn(
              "text-2xl font-bold tracking-tight",
              rtl && "font-arabic"
            )}
          >
            {t(locale, "channels.title")}
          </h2>
          <p
            className={cn(
              "text-muted-foreground text-sm",
              rtl && "font-arabic"
            )}
          >
            {t(locale, "channels.subtitle")}
          </p>
        </div>
        <Button
          onClick={openAddDialog}
          className={cn(
            "gap-2 shrink-0 bg-sage-600 hover:bg-sage-700 text-white",
            rtl && "font-arabic"
          )}
        >
          <Plus className="w-4 h-4" />
          {t(locale, "channels.addChannel")}
        </Button>
      </div>

      {/* Channel Cards */}
      <AnimatePresence mode="popLayout">
        <div className="grid gap-4 md:gap-6">
          {channels.map((channel) => (
            <motion.div
              key={channel.id}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12, scale: 0.97 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <ChannelCard
                channel={channel}
                locale={locale}
                rtl={rtl}
                onToggleActive={toggleChannelActive}
                onEdit={openEditDialog}
                onDelete={handleDelete}
                deleteConfirmId={deleteConfirmId}
                setDeleteConfirmId={setDeleteConfirmId}
                onUpdateCredential={updateChannelCredential}
                onAddCredential={addChannelCredential}
                onRemoveCredential={removeChannelCredential}
                onUpdateVariable={updateChannelVariable}
                onAddVariable={addChannelVariable}
                onRemoveVariable={removeChannelVariable}
                onUpdateImageSetName={updateChannelImageSetName}
                onUpdateImageSetUrl={updateChannelImageSetUrl}
                onAddImageSetUrl={addChannelImageSetUrl}
                onRemoveImageSetUrl={removeChannelImageSetUrl}
                onAddImageSet={addChannelImageSet}
                onRemoveImageSet={removeChannelImageSet}
                onSaveInline={saveChannelInline}
                isSaving={savingChannelId === channel.id}
              />
            </motion.div>
          ))}
        </div>
      </AnimatePresence>

      {/* Add/Edit Channel Dialog */}
      <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent
          className={cn(
            "sm:max-w-2xl max-h-[90vh] overflow-y-auto",
            rtl && "font-arabic"
          )}
          dir={rtl ? "rtl" : "ltr"}
        >
          <DialogHeader
            className={cn(rtl && "items-start text-right")}
          >
            <DialogTitle className={cn(rtl && "font-arabic text-right")}>
              {editingChannel
                ? t(locale, "channels.editChannel")
                : t(locale, "channels.addChannel")}
            </DialogTitle>
            <DialogDescription
              className={cn(rtl && "font-arabic text-right")}
            >
              {editingChannel
                ? rtl
                  ? "تعديل إعدادات القناة"
                  : "Modify channel settings"
                : rtl
                  ? "إضافة قناة تواصل جديدة"
                  : "Add a new communication channel"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Channel Name */}
            <div className="space-y-2">
              <Label className={cn(rtl && "font-arabic")}>
                {t(locale, "channels.channelName")}
                <span className="text-red-500 text-xs mr-2 ml-2 block sm:inline">
                  {rtl ? "(يجب أن يتطابق تماماً مع اسم Instance في Evolution API)" : "(Must match the Evolution API Instance name exactly)"}
                </span>
              </Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder={rtl ? "أدخل اسم القناة" : "Enter channel name"}
                className={cn(rtl && "font-arabic text-right")}
              />
            </div>

            {/* Channel Type */}
            <div className="space-y-2">
              <Label className={cn(rtl && "font-arabic")}>
                {t(locale, "channels.channelType")}
              </Label>
              <Select
                value={formData.type}
                onValueChange={(val) =>
                  setFormData((prev) => ({
                    ...prev,
                    type: val as ChannelType,
                  }))
                }
              >
                <SelectTrigger className={cn("w-full", rtl && "font-arabic")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    value="whatsapp"
                    className={rtl ? "font-arabic" : ""}
                  >
                    {t(locale, "channels.whatsapp")}
                  </SelectItem>
                  <SelectItem
                    value="facebook"
                    className={rtl ? "font-arabic" : ""}
                  >
                    {t(locale, "channels.facebook")}
                  </SelectItem>
                  <SelectItem
                    value="instagram"
                    className={rtl ? "font-arabic" : ""}
                  >
                    {t(locale, "channels.instagram")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Webhook URL */}
            <div className="space-y-2">
              <Label className={cn(rtl && "font-arabic")}>
                {rtl ? "رابط Webhook" : "Webhook URL"}
              </Label>
              <Input
                value={formData.webhookUrl || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, webhookUrl: e.target.value }))
                }
                placeholder={rtl ? "أدخل رابط Webhook" : "Enter Webhook URL"}
                className={cn("font-mono text-sm", rtl && "text-right")}
                dir="ltr"
              />
            </div>

            <Separator />

            {/* Credentials Section */}
            <div className="space-y-3">
              <div
                className={cn(
                  "flex items-center gap-2",
                  ""
                )}
              >
                <Key
                  className={cn(
                    "w-4 h-4 shrink-0",
                    sectionAccents.credentials.iconColor
                  )}
                />
                <Label
                  className={cn(
                    "text-sm font-semibold",
                    rtl && "font-arabic"
                  )}
                >
                  {t(locale, "channels.credentials")}
                </Label>
              </div>
              <div className="space-y-2">
                {formData.credentials.map((cred, idx) => {
                  const isProtected = formData.type === "whatsapp" && cred.key.trim().toLowerCase() === "evolution_api";
                  return (
                  <div
                    key={idx}
                    className={cn(
                      "flex items-center gap-2",
                      ""
                    )}
                  >
                    <Input
                      value={cred.key}
                      onChange={(e) =>
                        updateFormCredential(idx, "key", e.target.value)
                      }
                      placeholder={t(locale, "channels.credentialKey")}
                      disabled={isProtected}
                      className={cn(
                        "flex-1 font-mono text-xs",
                        rtl && "text-right",
                        isProtected && "opacity-60 cursor-not-allowed bg-muted"
                      )}
                    />
                    <span className="text-muted-foreground text-xs font-bold">
                      =
                    </span>
                    <Input
                      value={cred.value}
                      onChange={(e) =>
                        updateFormCredential(idx, "value", e.target.value)
                      }
                      placeholder={t(locale, "channels.credentialValue")}
                      className={cn(
                        "flex-1 font-mono text-xs",
                        rtl && "text-right"
                      )}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive transition-colors"
                      onClick={() => removeFormCredential(idx)}
                      disabled={isProtected || formData.credentials.length <= 1}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                )})}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={addFormCredential}
                className={cn("gap-1.5 text-xs", rtl && "font-arabic")}
              >
                <Plus className="w-3 h-3" />
                {t(locale, "channels.addCredential")}
              </Button>
            </div>

            <Separator />

            {/* Variables Section */}
            <div className="space-y-3">
              <div
                className={cn(
                  "flex items-center gap-2",
                  ""
                )}
              >
                <Variable
                  className={cn(
                    "w-4 h-4 shrink-0",
                    sectionAccents.variables.iconColor
                  )}
                />
                <Label
                  className={cn(
                    "text-sm font-semibold",
                    rtl && "font-arabic"
                  )}
                >
                  {t(locale, "channels.variables")}
                </Label>
              </div>
              <div className="space-y-2">
                {formData.variables.map((v, idx) => {
                  const isProtected = PROTECTED_VARIABLES.includes(v.name.trim().toLowerCase());
                  return (
                    <div
                      key={idx}
                      className={cn(
                        "flex items-center gap-2",
                        ""
                      )}
                    >
                      <Input
                        value={v.name}
                        onChange={(e) =>
                          updateFormVariable(idx, "name", e.target.value)
                        }
                        placeholder={t(locale, "channels.variableName")}
                        disabled={isProtected}
                        className={cn(
                          "flex-1 font-mono text-xs",
                          rtl && "text-right",
                          isProtected && "opacity-60 cursor-not-allowed bg-muted"
                        )}
                      />
                      <span className="text-muted-foreground text-xs font-bold">
                        =
                      </span>
                      <Input
                        value={v.value}
                        onChange={(e) =>
                          updateFormVariable(idx, "value", e.target.value)
                        }
                        placeholder={t(locale, "channels.variableValue")}
                        className={cn(
                          "flex-1 font-mono text-xs",
                          rtl && "text-right"
                        )}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive transition-colors"
                        onClick={() => removeFormVariable(idx)}
                        disabled={isProtected || formData.variables.length <= 1}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={addFormVariable}
                className={cn("gap-1.5 text-xs", rtl && "font-arabic")}
              >
                <Plus className="w-3 h-3" />
                {t(locale, "channels.addVariable")}
              </Button>
            </div>

            <Separator />

            {/* Image Sets Section */}
            <div className="space-y-3">
              <div
                className={cn(
                  "flex items-center gap-2",
                  ""
                )}
              >
                <ImageIcon
                  className={cn(
                    "w-4 h-4 shrink-0",
                    sectionAccents.imageSets.iconColor
                  )}
                />
                <Label
                  className={cn(
                    "text-sm font-semibold",
                    rtl && "font-arabic"
                  )}
                >
                  {t(locale, "channels.imageSets")}
                </Label>
              </div>
              <div className="space-y-4">
                {formData.imageSets.map((imgSet, setIdx) => (
                  <div
                    key={setIdx}
                    className={cn(
                      "p-3 rounded-lg border bg-muted/30 space-y-2",
                      rtl && "text-right"
                    )}
                  >
                    <div
                      className={cn(
                        "flex items-center gap-2",
                        ""
                      )}
                    >
                      <Input
                        value={imgSet.name}
                        onChange={(e) =>
                          updateFormImageSetName(setIdx, e.target.value)
                        }
                        placeholder={t(locale, "channels.imageSetName")}
                        className={cn(
                          "flex-1 font-mono text-xs",
                          rtl && "text-right"
                        )}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive transition-colors"
                        onClick={() => removeFormImageSet(setIdx)}
                        disabled={formData.imageSets.length <= 1}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    {imgSet.urls.map((url, urlIdx) => (
                      <div
                        key={urlIdx}
                        className={cn(
                          "flex items-center gap-2",
                          rtl ? "pr-4 pl-0" : "pl-4"
                        )}
                      >
                        <Input
                          value={url}
                          onChange={(e) =>
                            updateFormImageSetUrl(
                              setIdx,
                              urlIdx,
                              e.target.value
                            )
                          }
                          placeholder={t(locale, "channels.imageUrl")}
                          className={cn(
                            "flex-1 font-mono text-xs",
                            rtl && "text-right"
                          )}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0 h-7 w-7 text-muted-foreground hover:text-destructive transition-colors"
                          onClick={() =>
                            removeFormImageSetUrl(setIdx, urlIdx)
                          }
                          disabled={imgSet.urls.length <= 1}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addFormImageSetUrl(setIdx)}
                      className={cn(
                        "gap-1.5 text-xs",
                        rtl ? "mr-4 font-arabic" : "ml-4"
                      )}
                    >
                      <Plus className="w-3 h-3" />
                      {t(locale, "channels.addImage")}
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={addFormImageSet}
                className={cn("gap-1.5 text-xs", rtl && "font-arabic")}
              >
                <Plus className="w-3 h-3" />
                {t(locale, "channels.addImageSet")}
              </Button>
            </div>
          </div>

          <DialogFooter
            className={cn(
              "gap-2 sm:gap-0",
              ""
            )}
          >
            <Button
              variant="outline"
              onClick={() => handleDialogClose(false)}
              className={cn(rtl && "font-arabic")}
            >
              {t(locale, "cancel")}
            </Button>
            <Button
              onClick={handleSave}
              disabled={!formData.name.trim()}
              className={cn(
                "bg-sage-600 hover:bg-sage-700 text-white disabled:opacity-50",
                rtl && "font-arabic"
              )}
            >
              {t(locale, "save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── ChannelCard Sub-Component ────────────────────────────────────────────────

interface ChannelCardProps {
  channel: Channel;
  locale: "ar" | "en";
  rtl: boolean;
  onToggleActive: (id: string) => void;
  onEdit: (channel: Channel) => void;
  onDelete: (id: string) => void;
  deleteConfirmId: string | null;
  setDeleteConfirmId: (id: string | null) => void;
  onUpdateCredential: (
    channelId: string,
    index: number,
    field: "key" | "value",
    val: string
  ) => void;
  onAddCredential: (channelId: string) => void;
  onRemoveCredential: (channelId: string, index: number) => void;
  onUpdateVariable: (
    channelId: string,
    index: number,
    field: "name" | "value",
    val: string
  ) => void;
  onAddVariable: (channelId: string) => void;
  onRemoveVariable: (channelId: string, index: number) => void;
  onUpdateImageSetName: (
    channelId: string,
    setIndex: number,
    val: string
  ) => void;
  onUpdateImageSetUrl: (
    channelId: string,
    setIndex: number,
    urlIndex: number,
    val: string
  ) => void;
  onAddImageSetUrl: (channelId: string, setIndex: number) => void;
  onRemoveImageSetUrl: (
    channelId: string,
    setIndex: number,
    urlIndex: number
  ) => void;
  onAddImageSet: (channelId: string) => void;
  onRemoveImageSet: (channelId: string, setIndex: number) => void;
  onSaveInline: (channel: Channel) => void;
  isSaving: boolean;
}

function ChannelCard({
  channel,
  locale,
  rtl,
  onToggleActive,
  onEdit,
  onDelete,
  deleteConfirmId,
  setDeleteConfirmId,
  onUpdateCredential,
  onAddCredential,
  onRemoveCredential,
  onUpdateVariable,
  onAddVariable,
  onRemoveVariable,
  onUpdateImageSetName,
  onUpdateImageSetUrl,
  onAddImageSetUrl,
  onRemoveImageSetUrl,
  onAddImageSet,
  onRemoveImageSet,
  onSaveInline,
  isSaving,
}: ChannelCardProps) {
  const { userRole } = useAppStore();
  const config = channelTypeConfig[channel.type];
  const Icon = config.icon;
  const isConfirmingDelete = deleteConfirmId === channel.id;

  // Track which credentials are revealed (unmasked)
  const [revealedCreds, setRevealedCreds] = useState<Set<number>>(new Set());
  const toggleReveal = (idx: number) => {
    setRevealedCreds((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  const [uploadingSetIdx, setUploadingSetIdx] = useState<number | null>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, setIdx: number) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    try {
      setUploadingSetIdx(setIdx);
      const url = await uploadImage(file, 'saloon_uploads', 'channels');
      const currentLength = channel.imageSets[setIdx].urls.length;
      onUpdateImageSetUrl(channel.id, setIdx, currentLength, url);
      
      // Auto-save to backend
      const newImageSets = [...channel.imageSets];
      newImageSets[setIdx] = { ...newImageSets[setIdx], urls: [...newImageSets[setIdx].urls, url] };
      await fetch(`/api/channels/${channel.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageSets: newImageSets }),
      });
      toast.success("تم حفظ الاعدادات");
    } catch (err) {
      console.error("Failed to upload image:", err);
      toast.error("فشل في رفع الصورة");
    } finally {
      setUploadingSetIdx(null);
      e.target.value = '';
    }
  };

  // Track open image set sub-sections
  const [openImageSets, setOpenImageSets] = useState<Set<number>>(new Set([0]));
  const toggleImageSet = (idx: number) => {
    setOpenImageSets((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  // Automatically open newly added image sets
  const prevImageSetCount = useRef(channel.imageSets.length);
  useEffect(() => {
    if (channel.imageSets.length > prevImageSetCount.current) {
      setOpenImageSets((prev) => new Set([...prev, channel.imageSets.length - 1]));
    }
    prevImageSetCount.current = channel.imageSets.length;
  }, [channel.imageSets.length]);

  const maskValue = (val: string, revealed: boolean) => {
    if (revealed) return val;
    if (val.length <= 4) return "••••";
    return val.slice(0, 4) + "••••";
  };

  return (
    <Card
      className={cn(
        "overflow-hidden transition-all duration-200 hover:shadow-md border-l-4",
        config.accentBorder,
        !channel.isActive && "opacity-70",
        rtl && "border-l-0 border-r-4"
      )}
    >
      {/* Card Header */}
      <CardHeader className="pb-3">
        <div
          className={cn(
            "flex items-center justify-between gap-4",
            ""
          )}
        >
          <div
            className={cn(
              "flex items-center gap-3 min-w-0",
              ""
            )}
          >
            <div className={cn("p-2.5 rounded-xl shrink-0", config.iconBg)}>
              <Icon className={cn("w-5 h-5", config.textColor)} />
            </div>
            <div className={cn("min-w-0", rtl && "text-right")}>
              <CardTitle
                className={cn("text-base leading-tight", rtl && "font-arabic")}
              >
                {channel.name}
              </CardTitle>
              <div
                className={cn(
                  "flex items-center gap-2 mt-1.5 flex-wrap",
                  rtl && "justify-end"
                )}
              >
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[11px] font-medium border",
                    config.bgColor,
                    config.textColor,
                    config.borderColor
                  )}
                >
                  {rtl ? config.labelAr : config.label}
                </Badge>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[11px] font-medium border gap-1.5",
                    channel.isActive
                      ? "bg-sage-50 dark:bg-sage-900/20 text-sage-700 dark:text-sage-400 border-sage-200 dark:border-sage-800/40"
                      : "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/40"
                  )}
                >
                  <div className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    channel.isActive ? "bg-sage-500" : "bg-red-500"
                  )} />
                  {channel.isActive
                    ? t(locale, "active")
                    : t(locale, "inactive")}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              role="switch"
              aria-checked={channel.isActive}
              onClick={() => onToggleActive(channel.id)}
              className={cn(
                "relative inline-flex h-7 w-[3.5rem] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                channel.isActive
                  ? "bg-sage-500 dark:bg-sage-600"
                  : "bg-gray-300 dark:bg-gray-600"
              )}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ease-in-out",
                  channel.isActive
                    ? (rtl ? "-translate-x-6" : "translate-x-6")
                    : "translate-x-0"
                )}
              />
              <span className={cn(
                "absolute text-[8px] font-bold uppercase tracking-wide text-white",
                channel.isActive
                  ? (rtl ? "right-2" : "left-2")
                  : (rtl ? "left-2" : "right-2")
              )}>
                {channel.isActive
                  ? (rtl ? "يعمل" : "ON")
                  : (rtl ? "مقفل" : "OFF")}
              </span>
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Accordion Sections */}
        <Accordion
          type="multiple"
          className="w-full"
          defaultValue={[]}
        >
          {/* ── Credentials ── */}
          {userRole !== "demo" && (
            <AccordionItem value={`${channel.id}-credentials`}>
              <AccordionTrigger
                className={cn(
                  "text-sm font-medium hover:no-underline py-3",
                  rtl && "font-arabic"
                )}
              >
                <div
                  className={cn(
                    "flex items-center gap-2",
                    ""
                  )}
                >
                  <Key
                    className={cn(
                      "w-4 h-4",
                      sectionAccents.credentials.iconColor
                    )}
                  />
                  <span>{t(locale, "channels.credentials")}</span>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-[10px] px-1.5 py-0",
                      sectionAccents.credentials.badgeBg,
                      sectionAccents.credentials.badgeText,
                      sectionAccents.credentials.badgeBorder,
                      "border"
                    )}
                  >
                    {channel.credentials.length}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  {channel.credentials.map((cred, idx) => {
                    const isRevealed = revealedCreds.has(idx);
                    const isProtected = channel.type === "whatsapp" && cred.key.trim().toLowerCase() === "evolution_api";
                    return (
                      <div
                        key={idx}
                        className={cn(
                          "flex items-center gap-2 group",
                          ""
                        )}
                      >
                        <Input
                          value={cred.key}
                          onChange={(e) =>
                            onUpdateCredential(
                              channel.id,
                              idx,
                              "key",
                              e.target.value
                            )
                          }
                          disabled={isProtected}
                          className={cn(
                            "flex-1 font-mono text-xs h-8 bg-terracotta-50/30 dark:bg-terracotta-900/10 border-terracotta-200/50 dark:border-terracotta-800/30 focus:border-terracotta-400",
                            rtl && "text-right",
                            isProtected && "opacity-60 cursor-not-allowed bg-muted/50"
                          )}
                        />
                        <span className="text-muted-foreground text-xs font-bold">
                          =
                        </span>
                        <Input
                          value={maskValue(cred.value, isRevealed)}
                          onChange={(e) =>
                            onUpdateCredential(
                              channel.id,
                              idx,
                              "value",
                              e.target.value
                            )
                          }
                          className={cn(
                            "flex-1 font-mono text-xs h-8 bg-terracotta-50/30 dark:bg-terracotta-900/10 border-terracotta-200/50 dark:border-terracotta-800/30 focus:border-terracotta-400",
                            rtl && "text-right"
                          )}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0 h-7 w-7 text-muted-foreground hover:text-terracotta-600 transition-colors"
                          onClick={() => toggleReveal(idx)}
                          title={isRevealed ? "Hide" : "Reveal"}
                        >
                          {isRevealed ? (
                            <EyeOff className="w-3.5 h-3.5" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0 h-7 w-7 text-muted-foreground hover:text-destructive transition-colors"
                          onClick={() => onRemoveCredential(channel.id, idx)}
                          disabled={isProtected || channel.credentials.length <= 1}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    );
                  })}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onAddCredential(channel.id)}
                    className={cn(
                      "gap-1.5 text-xs h-7 border-dashed border-terracotta-300 dark:border-terracotta-700 text-terracotta-600 dark:text-terracotta-400 hover:bg-terracotta-50 dark:hover:bg-terracotta-900/20",
                      rtl && "font-arabic"
                    )}
                  >
                    <Plus className="w-3 h-3" />
                    {t(locale, "channels.addCredential")}
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* ── Variables ── */}
          <AccordionItem value={`${channel.id}-variables`}>
            <AccordionTrigger
              className={cn(
                "text-sm font-medium hover:no-underline py-3",
                rtl && "font-arabic"
              )}
            >
              <div
                className={cn(
                  "flex items-center gap-2",
                  ""
                )}
              >
                <Variable
                  className={cn(
                    "w-4 h-4",
                    sectionAccents.variables.iconColor
                  )}
                />
                <span>{t(locale, "channels.variables")}</span>
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-[10px] px-1.5 py-0",
                    sectionAccents.variables.badgeBg,
                    sectionAccents.variables.badgeText,
                    sectionAccents.variables.badgeBorder,
                    "border"
                  )}
                >
                  {channel.variables.length}
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                {channel.variables.map((v, idx) => {
                  const isProtected = PROTECTED_VARIABLES.includes(v.name.trim().toLowerCase());
                  return (
                    <div
                      key={idx}
                      className={cn(
                        "flex items-center gap-2",
                        ""
                      )}
                    >
                      <Input
                        value={v.name}
                        onChange={(e) =>
                          onUpdateVariable(
                            channel.id,
                            idx,
                            "name",
                            e.target.value
                          )
                        }
                        disabled={isProtected}
                        className={cn(
                          "flex-1 font-mono text-xs h-8 bg-sage-50/30 dark:bg-sage-900/10 border-sage-200/50 dark:border-sage-800/30 focus:border-sage-400",
                          rtl && "text-right",
                          isProtected && "opacity-60 cursor-not-allowed bg-muted"
                        )}
                      />
                      <span className="text-muted-foreground text-xs font-bold">
                        =
                      </span>
                      <Input
                        value={v.value}
                        onChange={(e) =>
                          onUpdateVariable(
                            channel.id,
                            idx,
                            "value",
                            e.target.value
                          )
                        }
                        className={cn(
                          "flex-1 font-mono text-xs h-8 bg-sage-50/30 dark:bg-sage-900/10 border-sage-200/50 dark:border-sage-800/30 focus:border-sage-400",
                          rtl && "text-right"
                        )}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 h-7 w-7 text-muted-foreground hover:text-destructive transition-colors"
                        onClick={() => onRemoveVariable(channel.id, idx)}
                        disabled={isProtected || channel.variables.length <= 1}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  );
                })}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAddVariable(channel.id)}
                  className={cn(
                    "gap-1.5 text-xs h-7 border-dashed border-sage-300 dark:border-sage-700 text-sage-600 dark:text-sage-400 hover:bg-sage-50 dark:hover:bg-sage-900/20",
                    rtl && "font-arabic"
                  )}
                >
                  <Plus className="w-3 h-3" />
                  {t(locale, "channels.addVariable")}
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* ── Image Sets ── */}
          <AccordionItem value={`${channel.id}-imagesets`}>
            <AccordionTrigger
              className={cn(
                "text-sm font-medium hover:no-underline py-3",
                rtl && "font-arabic"
              )}
            >
              <div
                className={cn(
                  "flex items-center gap-2",
                  ""
                )}
              >
                <ImageIcon
                  className={cn(
                    "w-4 h-4",
                    sectionAccents.imageSets.iconColor
                  )}
                />
                <span>{t(locale, "channels.imageSets")}</span>
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-[10px] px-1.5 py-0",
                    sectionAccents.imageSets.badgeBg,
                    sectionAccents.imageSets.badgeText,
                    sectionAccents.imageSets.badgeBorder,
                    "border"
                  )}
                >
                  {channel.imageSets.length}
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                {channel.imageSets.map((imgSet, setIdx) => {
                  const isOpen = openImageSets.has(setIdx);
                  return (
                    <div
                      key={setIdx}
                      className={cn(
                        "rounded-lg border bg-amber-50/20 dark:bg-amber-900/5 border-amber-200/40 dark:border-amber-800/20 overflow-hidden"
                      )}
                    >
                      {/* Image Set Header - Collapsible */}
                      <Collapsible
                        open={isOpen}
                        onOpenChange={() => toggleImageSet(setIdx)}
                      >
                        <div
                          className={cn(
                            "flex items-center gap-2 px-3 py-2",
                            ""
                          )}
                        >
                          <CollapsibleTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={cn(
                                "h-6 px-1.5 text-xs gap-1",
                                rtl && "font-arabic"
                              )}
                            >
                              <motion.div
                                animate={{ rotate: isOpen ? 180 : 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                <ChevronDown className="w-3.5 h-3.5" />
                              </motion.div>
                            </Button>
                          </CollapsibleTrigger>
                          <Input
                            placeholder={rtl ? "اسم المجموعة..." : "Set name..."}
                            value={imgSet.name}
                            onChange={(e) =>
                              onUpdateImageSetName(
                                channel.id,
                                setIdx,
                                e.target.value
                              )
                            }
                            className={cn(
                              "flex-1 font-mono text-xs h-7 bg-transparent border-0 focus-visible:ring-0 focus-visible:border-0 px-0 shadow-none",
                              rtl && "text-right"
                            )}
                          />
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0 shrink-0"
                          >
                            {imgSet.urls.length}{" "}
                            {rtl ? "صور" : "imgs"}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="shrink-0 h-6 w-6 text-muted-foreground hover:text-destructive transition-colors"
                            onClick={() =>
                              onRemoveImageSet(channel.id, setIdx)
                            }
                            disabled={channel.imageSets.length <= 1}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                        <CollapsibleContent>
                          <div className="px-3 pb-2 space-y-1.5">
                            {imgSet.urls.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-2">
                                {imgSet.urls.filter(u => u && u.trim() !== "").map((url, urlIdx) => (
                                  <div key={urlIdx} className="relative w-16 h-16 rounded-md overflow-hidden border bg-background shrink-0">
                                    <img src={url} alt="" className="w-full h-full object-cover" />
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        await deleteImage(url).catch(console.error);
                                        onRemoveImageSetUrl(channel.id, setIdx, urlIdx);
                                        
                                        // Auto-save to backend
                                        const newImageSets = [...channel.imageSets];
                                        newImageSets[setIdx] = {
                                          ...newImageSets[setIdx],
                                          urls: newImageSets[setIdx].urls.filter((_, i) => i !== urlIdx)
                                        };
                                        try {
                                          await fetch(`/api/channels/${channel.id}`, {
                                            method: "PUT",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({ imageSets: newImageSets }),
                                          });
                                          toast.success("تم حفظ الاعدادات");
                                        } catch (err) {
                                          console.error("Failed to save deletion:", err);
                                          toast.error("فشل في حذف الصورة");
                                        }
                                      }}
                                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            <div className="relative">
                              <input
                                type="file"
                                id={`channel-${channel.id}-set-${setIdx}-upload`}
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleImageUpload(e, setIdx)}
                                disabled={uploadingSetIdx === setIdx}
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => document.getElementById(`channel-${channel.id}-set-${setIdx}-upload`)?.click()}
                                disabled={uploadingSetIdx === setIdx}
                                className={cn(
                                  "gap-1 text-[11px] h-6 border-dashed border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20",
                                  rtl && "font-arabic"
                                )}
                              >
                                {uploadingSetIdx === setIdx ? (
                                  <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                ) : (
                                  <Plus className="w-2.5 h-2.5" />
                                )}
                                {t(locale, "channels.addImage")}
                              </Button>
                            </div>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                  );
                })}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAddImageSet(channel.id)}
                  className={cn(
                    "gap-1.5 text-xs h-7 border-dashed border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20",
                    rtl && "font-arabic"
                  )}
                >
                  <Plus className="w-3 h-3" />
                  {t(locale, "channels.addImageSet")}
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>

      {/* Card Footer with Edit / Delete */}
      <CardFooter className="pt-0 pb-4 px-6">
        <div
          className={cn(
            "flex items-center gap-2 w-full",
            rtl ? "justify-start" : "justify-end"
          )}
        >
          {isConfirmingDelete ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={cn(
                "flex items-center gap-2",
                ""
              )}
            >
              <span
                className={cn(
                  "text-xs text-destructive",
                  rtl && "font-arabic"
                )}
              >
                {t(locale, "channels.deleteConfirm")}
              </span>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onDelete(channel.id)}
                className={cn("h-7 text-xs", rtl && "font-arabic")}
              >
                {t(locale, "confirm")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteConfirmId(null)}
                className={cn("h-7 text-xs", rtl && "font-arabic")}
              >
                {t(locale, "cancel")}
              </Button>
            </motion.div>
          ) : (
            <>
              <Button
                variant="default"
                size="sm"
                onClick={() => onSaveInline(channel)}
                disabled={isSaving}
                className={cn(
                  "gap-1.5 h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white",
                  rtl && "font-arabic"
                )}
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                {rtl ? "حفظ التعديلات" : "Save Changes"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(channel)}
                className={cn(
                  "gap-1.5 h-8 text-xs",
                  rtl && "font-arabic"
                )}
              >
                <Pencil className="w-3.5 h-3.5" />
                {t(locale, "edit")}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteConfirmId(channel.id)}
                className={cn(
                  "gap-1.5 h-8 text-xs text-muted-foreground hover:text-destructive",
                  rtl && "font-arabic"
                )}
              >
                <Trash2 className="w-3.5 h-3.5" />
                {t(locale, "delete")}
              </Button>
            </>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
