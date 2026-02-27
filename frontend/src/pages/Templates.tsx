"use client"

import { useState, useMemo } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next" // AÑADIDO
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Phone, ExternalLink, MessageSquare } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { LanguageSelector } from "@/components/LanguageSelector"

// Tipos
type TemplateCategory = "UTILITY" | "AUTHENTICATION" | "MARKETING" | "SERVICE"
type TemplateStatus = "PENDING" | "APPROVED" | "REJECTED"
type HeaderType = "TEXT" | "IMAGE" | "VIDEO" | "DOCUMENT" | "NONE"
type ButtonType = "QUICK_REPLY" | "PHONE_NUMBER" | "URL"

interface TemplateButton {
  type: ButtonType
  text: string
  phone_number?: string
  url?: string
}

interface Template {
  id: string
  name: string
  category: TemplateCategory
  language: string
  status: TemplateStatus
  header_type: HeaderType
  header_text?: string
  header_media_url?: string
  body: string
  footer?: string
  buttons: TemplateButton[]
  created_at: string
}

export default function TemplatesPage() {
  const { user } = useAuth()
  const { t } = useTranslation() // AÑADIDO
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)

  // Fetch templates
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["templates", user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/templates?userId=${user?.id}`)
      if (!response.ok) throw new Error("Error al cargar templates")
      return response.json()
    },
    enabled: !!user,
  })

  // Filtered templates
  const filteredTemplates = useMemo(() => {
    return templates.filter((template: Template) => {
      const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = filterCategory === "all" || template.category === filterCategory
      const matchesStatus = filterStatus === "all" || template.status === filterStatus
      return matchesSearch && matchesCategory && matchesStatus
    })
  }, [templates, searchTerm, filterCategory, filterStatus])

  return (
    <div className="space-y-2 mt-1">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('templates.title')}</h1>
            <p className="text-gray-600 mt-1">{t('templates.subtitle')}</p>
          </div>
          <div className="flex items-center space-x-2">
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="bg-red-600 hover:bg-red-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  {t('templates.new')}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <TemplateFormDialog onClose={() => setIsCreateOpen(false)} template={selectedTemplate} />
              </DialogContent>
            </Dialog>
            <div>
              <LanguageSelector />
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder={t('templates.search')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue placeholder={t('templates.allCategories')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('templates.allCategories')}</SelectItem>
                  <SelectItem value="UTILITY">{t('templates.categories.UTILITY')}</SelectItem>
                  <SelectItem value="AUTHENTICATION">{t('templates.categories.AUTHENTICATION')}</SelectItem>
                  <SelectItem value="MARKETING">{t('templates.categories.MARKETING')}</SelectItem>
                  <SelectItem value="SERVICE">{t('templates.categories.SERVICE')}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder={t('templates.allStatus')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('templates.allStatus')}</SelectItem>
                  <SelectItem value="PENDING">{t('templates.status.PENDING')}</SelectItem>
                  <SelectItem value="APPROVED">{t('templates.status.APPROVED')}</SelectItem>
                  <SelectItem value="REJECTED">{t('templates.status.REJECTED')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Templates Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">{t('templates.loading')}</p>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <Card className="py-12">
            <CardContent className="text-center">
              <MessageSquare className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('templates.noTemplates')}</h3>
              <p className="text-gray-600 mb-4">{t('templates.firstTemplate')}</p>
              <Button onClick={() => setIsCreateOpen(true)} className="bg-red-600 hover:bg-red-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                {t('templates.create')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((template: Template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onEdit={(t) => {
                  setSelectedTemplate(t)
                  setIsCreateOpen(true)
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Template Card Component
function TemplateCard({ template, onEdit }: { template: Template; onEdit: (t: Template) => void }) {
  const { t } = useTranslation() // AÑADIDO
  const statusColors = {
    PENDING: "bg-yellow-100 text-yellow-800",
    APPROVED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
  }

  const categoryColors = {
    UTILITY: "bg-blue-100 text-blue-800",
    AUTHENTICATION: "bg-purple-100 text-purple-800",
    MARKETING: "bg-pink-100 text-pink-800",
    SERVICE: "bg-cyan-100 text-cyan-800",
  }

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onEdit(template)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-semibold text-gray-900 text-lg">{template.name}</h3>
          <Badge className={statusColors[template.status]}>{t(`templates.status.${template.status}`)}</Badge>
        </div>
        <Badge className={`${categoryColors[template.category]} mb-3`}>{t(`templates.categories.${template.category}`)}</Badge>
        <div className="space-y-2 text-sm">
          {template.header_text && <div className="font-semibold text-gray-700">{template.header_text}</div>}
          <p className="text-gray-600 line-clamp-3">{template.body}</p>
          {template.footer && <p className="text-xs text-gray-500">{template.footer}</p>}
          {template.buttons.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {template.buttons.map((btn, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {btn.type === "PHONE_NUMBER" && <Phone className="w-3 h-3 mr-1" />}
                  {btn.type === "URL" && <ExternalLink className="w-3 h-3 mr-1" />}
                  {btn.text}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Template Form Dialog Component
function TemplateFormDialog({ onClose, template }: { onClose: () => void; template: Template | null }) {
  const { t } = useTranslation() // AÑADIDO
  const [activeTab, setActiveTab] = useState("basic")
  const [formData, setFormData] = useState({
    name: template?.name || "",
    category: template?.category || "UTILITY",
    language: template?.language || "es",
    header_type: template?.header_type || "NONE",
    header_text: template?.header_text || "",
    header_media_url: template?.header_media_url || "",
    body: template?.body || "",
    footer: template?.footer || "",
    buttons: template?.buttons || [],
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateName = (name: string) => {
    if (!/^[a-z0-9_]+$/.test(name)) return t('templates.validation.nameFormat')
    if (name.length > 512) return t('templates.validation.nameLength')
    return ""
  }

  const handleSubmit = async () => {
    const newErrors: Record<string, string> = {}

    // Validaciones
    const nameError = validateName(formData.name)
    if (nameError) newErrors.name = nameError
    if (!formData.body) newErrors.body = t('templates.validation.bodyRequired')
    if (formData.body.length > 1024) newErrors.body = t('templates.validation.bodyLength')
    if (formData.footer && formData.footer.length > 60) newErrors.footer = t('templates.validation.footerLength')
    if (formData.header_text && formData.header_text.length > 60) newErrors.header_text = t('templates.validation.headerLength')
    if (formData.buttons.length > 3) newErrors.buttons = t('templates.validation.buttonsMax')

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    console.log("Guardando template:", formData)
    onClose()
  }

  return (
    <div>
      <DialogHeader>
        <DialogTitle>{template ? t('templates.edit') : t('templates.create')}</DialogTitle>
      </DialogHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">{t('templates.tabs.basic')}</TabsTrigger>
          <TabsTrigger value="header">{t('templates.tabs.header')}</TabsTrigger>
          <TabsTrigger value="body">{t('templates.tabs.body')}</TabsTrigger>
          <TabsTrigger value="footer">{t('templates.tabs.footer')}</TabsTrigger>
        </TabsList>

        {/* Tab 1: Básico */}
        <TabsContent value="basic" className="space-y-4">
          <div>
            <Label htmlFor="name">{t('templates.form.name')}</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => {
                const value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "")
                setFormData({ ...formData, name: value })
                const error = validateName(value)
                setErrors({ ...errors, name: error })
              }}
              placeholder={t('templates.form.namePlaceholder')}
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
            <p className="text-xs text-gray-500 mt-1">{t('templates.form.nameHelp')}</p>
          </div>

          <div>
            <Label htmlFor="category">{t('templates.form.category')}</Label>
            <Select
              value={formData.category}
              onValueChange={(value: TemplateCategory) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UTILITY">{t('templates.categories.UTILITY_DESC')}</SelectItem>
                <SelectItem value="AUTHENTICATION">{t('templates.categories.AUTHENTICATION_DESC')}</SelectItem>
                <SelectItem value="MARKETING">{t('templates.categories.MARKETING_DESC')}</SelectItem>
                <SelectItem value="SERVICE">{t('templates.categories.SERVICE_DESC')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="language">{t('templates.form.language')}</Label>
            <Select value={formData.language} onValueChange={(value) => setFormData({ ...formData, language: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="es">Español</SelectItem>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="fr">Français</SelectItem>
                <SelectItem value="pt">Portugués</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </TabsContent>

        {/* Tab 2: Header */}
        <TabsContent value="header" className="space-y-4">
          <div>
            <Label htmlFor="header_type">{t('templates.form.headerType')}</Label>
            <Select
              value={formData.header_type}
              onValueChange={(value: HeaderType) => setFormData({ ...formData, header_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">{t('templates.form.headerTypes.NONE')}</SelectItem>
                <SelectItem value="TEXT">{t('templates.form.headerTypes.TEXT')}</SelectItem>
                <SelectItem value="IMAGE">{t('templates.form.headerTypes.IMAGE')}</SelectItem>
                <SelectItem value="VIDEO">{t('templates.form.headerTypes.VIDEO')}</SelectItem>
                <SelectItem value="DOCUMENT">{t('templates.form.headerTypes.DOCUMENT')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.header_type === "TEXT" && (
            <div>
              <Label htmlFor="header_text">{t('templates.form.headerText')}</Label>
              <Input
                id="header_text"
                value={formData.header_text}
                onChange={(e) => setFormData({ ...formData, header_text: e.target.value })}
                placeholder={t('templates.form.headerTextPlaceholder')}
                maxLength={60}
                className={errors.header_text ? "border-red-500" : ""}
              />
              {errors.header_text && <p className="text-sm text-red-600 mt-1">{errors.header_text}</p>}
              <p className="text-xs text-gray-500 mt-1">{formData.header_text.length}/60</p>
            </div>
          )}

          {(formData.header_type === "IMAGE" ||
            formData.header_type === "VIDEO" ||
            formData.header_type === "DOCUMENT") && (
              <div>
                <Label htmlFor="header_media_url">{t('templates.form.headerMediaUrl')}</Label>
                <Input
                  id="header_media_url"
                  type="url"
                  value={formData.header_media_url}
                  onChange={(e) => setFormData({ ...formData, header_media_url: e.target.value })}
                  placeholder={t('templates.form.headerMediaUrlPlaceholder')}
                />
                <p className="text-xs text-gray-500 mt-1">{t('templates.form.headerMediaUrlHelp')}</p>
              </div>
            )}
        </TabsContent>

        {/* Tab 3: Body */}
        <TabsContent value="body" className="space-y-4">
          <div>
            <Label htmlFor="body">{t('templates.form.body')}</Label>
            <Textarea
              id="body"
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              placeholder={t('templates.form.bodyPlaceholder')}
              rows={8}
              maxLength={1024}
              className={errors.body ? "border-red-500" : ""}
            />
            {errors.body && <p className="text-sm text-red-600 mt-1">{errors.body}</p>}
            <p className="text-xs text-gray-500 mt-1">
              {formData.body.length}/1024 {t('templates.form.bodyHelp')}
            </p>
          </div>

          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-900 font-medium mb-1">💡 {t('templates.form.tipTitle')}</p>
            <p className="text-xs text-blue-800">{t('templates.form.tipDesc')}</p>
          </div>
        </TabsContent>

        {/* Tab 4: Footer & Botones */}
        <TabsContent value="footer" className="space-y-4">
          <div>
            <Label htmlFor="footer">{t('templates.form.footer')}</Label>
            <Input
              id="footer"
              value={formData.footer}
              onChange={(e) => setFormData({ ...formData, footer: e.target.value })}
              placeholder={t('templates.form.footerPlaceholder')}
              maxLength={60}
              className={errors.footer ? "border-red-500" : ""}
            />
            {errors.footer && <p className="text-sm text-red-600 mt-1">{errors.footer}</p>}
            <p className="text-xs text-gray-500 mt-1">{formData.footer?.length || 0}/60</p>
          </div>

          <div>
            <Label>{t('templates.form.buttons')}</Label>
            <div className="space-y-2 mt-2">
              {formData.buttons.map((button, index) => (
                <div key={index} className="flex gap-2 items-start p-3 border rounded-lg">
                  <div className="flex-1 space-y-2">
                    <Select
                      value={button.type}
                      onValueChange={(value: ButtonType) => {
                        const newButtons = [...formData.buttons]
                        newButtons[index].type = value
                        setFormData({ ...formData, buttons: newButtons })
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="QUICK_REPLY">{t('templates.form.buttonTypes.QUICK_REPLY')}</SelectItem>
                        <SelectItem value="PHONE_NUMBER">{t('templates.form.buttonTypes.PHONE_NUMBER')}</SelectItem>
                        <SelectItem value="URL">{t('templates.form.buttonTypes.URL')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder={t('templates.form.buttonText')}
                      value={button.text}
                      onChange={(e) => {
                        const newButtons = [...formData.buttons]
                        newButtons[index].text = e.target.value
                        setFormData({ ...formData, buttons: newButtons })
                      }}
                    />
                    {button.type === "PHONE_NUMBER" && (
                      <Input
                        placeholder="+34600123456"
                        value={button.phone_number || ""}
                        onChange={(e) => {
                          const newButtons = [...formData.buttons]
                          newButtons[index].phone_number = e.target.value
                          setFormData({ ...formData, buttons: newButtons })
                        }}
                      />
                    )}
                    {button.type === "URL" && (
                      <Input
                        placeholder="https://ejemplo.com"
                        value={button.url || ""}
                        onChange={(e) => {
                          const newButtons = [...formData.buttons]
                          newButtons[index].url = e.target.value
                          setFormData({ ...formData, buttons: newButtons })
                        }}
                      />
                    )}
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      const newButtons = formData.buttons.filter((_, i) => i !== index)
                      setFormData({ ...formData, buttons: newButtons })
                    }}
                  >
                    {t('common.delete')}
                  </Button>
                </div>
              ))}
              {formData.buttons.length < 3 && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      buttons: [...formData.buttons, { type: "QUICK_REPLY", text: "" }],
                    })
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {t('templates.form.addButton')}
                </Button>
              )}
            </div>
            {errors.buttons && <p className="text-sm text-red-600 mt-1">{errors.buttons}</p>}
          </div>
        </TabsContent>
      </Tabs>

      {/* Preview */}
      <div className="mt-6 p-4 bg-gray-100 rounded-lg">
        <Label className="text-sm font-semibold mb-2 block">{t('templates.form.preview')}</Label>
        <div className="bg-white rounded-lg p-4 shadow-sm max-w-md">
          {formData.header_type === "TEXT" && formData.header_text && (
            <div className="font-bold text-gray-900 mb-2">{formData.header_text}</div>
          )}
          {formData.header_type === "IMAGE" && (
            <div className="bg-gray-200 h-32 rounded mb-2 flex items-center justify-center text-gray-500">
              {t('templates.form.headerTypes.IMAGE')}
            </div>
          )}
          <div className="text-gray-800 whitespace-pre-wrap mb-2">
            {formData.body || t('templates.form.previewBody')}
          </div>
          {formData.footer && <div className="text-xs text-gray-500 mb-3">{formData.footer}</div>}
          {formData.buttons.length > 0 && (
            <div className="space-y-1">
              {formData.buttons.map((btn, idx) => (
                <button
                  key={idx}
                  className="w-full py-2 text-center text-blue-600 border border-gray-300 rounded font-medium text-sm"
                >
                  {btn.text || t('templates.form.previewButton')}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 mt-6">
        <Button variant="outline" onClick={onClose}>
          {t('templates.form.cancel')}
        </Button>
        <Button onClick={handleSubmit} className="bg-red-600 hover:bg-red-700 text-white">
          {template ? t('templates.form.saveChanges') : t('templates.create')}
        </Button>
      </div>
    </div>
  )
}