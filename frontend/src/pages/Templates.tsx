"use client"

import { useState, useMemo } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
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

// Tipos para WhatsApp Business API
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
            <h1 className="text-3xl font-bold text-gray-900">Templates</h1>
            <p className="text-gray-600 mt-1">Crea y administra mensajes predefinidos para diversas situaciones</p>
          </div>
          <div className="flex items-center space-x-2">
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="bg-red-600 hover:bg-red-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Template
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
                  placeholder="Buscar templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas las categorías" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  <SelectItem value="UTILITY">Utilidad</SelectItem>
                  <SelectItem value="AUTHENTICATION">Autenticación</SelectItem>
                  <SelectItem value="MARKETING">Marketing</SelectItem>
                  <SelectItem value="SERVICE">Servicio</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="PENDING">Pendiente</SelectItem>
                  <SelectItem value="APPROVED">Aprobado</SelectItem>
                  <SelectItem value="REJECTED">Rechazado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Templates Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Cargando templates...</p>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <Card className="py-12">
            <CardContent className="text-center">
              <MessageSquare className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay templates aún</h3>
              <p className="text-gray-600 mb-4">Crea tu primer template para comenzar a automatizar respuestas</p>
              <Button onClick={() => setIsCreateOpen(true)} className="bg-red-600 hover:bg-red-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Crear Primer Template
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
          <Badge className={statusColors[template.status]}>{template.status}</Badge>
        </div>
        <Badge className={`${categoryColors[template.category]} mb-3`}>{template.category}</Badge>
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
    if (!/^[a-z0-9_]+$/.test(name)) {
      return "Solo letras minúsculas, números y guiones bajos"
    }
    if (name.length > 512) {
      return "Máximo 512 caracteres"
    }
    return ""
  }

  const handleSubmit = async () => {
    const newErrors: Record<string, string> = {}

    // Validaciones
    const nameError = validateName(formData.name)
    if (nameError) newErrors.name = nameError
    if (!formData.body) newErrors.body = "El cuerpo es obligatorio"
    if (formData.body.length > 1024) newErrors.body = "Máximo 1024 caracteres"
    if (formData.footer && formData.footer.length > 60) newErrors.footer = "Máximo 60 caracteres"
    if (formData.header_text && formData.header_text.length > 60) newErrors.header_text = "Máximo 60 caracteres"
    if (formData.buttons.length > 3) newErrors.buttons = "Máximo 3 botones"

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    // Aquí iría tu lógica de guardado
    console.log("Guardando template:", formData)
    onClose()
  }

  return (
    <div>
      <DialogHeader>
        <DialogTitle>{template ? "Editar Template" : "Crear Nuevo Template"}</DialogTitle>
      </DialogHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Básico</TabsTrigger>
          <TabsTrigger value="header">Header</TabsTrigger>
          <TabsTrigger value="body">Body</TabsTrigger>
          <TabsTrigger value="footer">Footer & Botones</TabsTrigger>
        </TabsList>

        {/* Tab 1: Básico */}
        <TabsContent value="basic" className="space-y-4">
          <div>
            <Label htmlFor="name">Nombre del Template *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => {
                const value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "")
                setFormData({ ...formData, name: value })
                const error = validateName(value)
                setErrors({ ...errors, name: error })
              }}
              placeholder="ej: respuesta_llamada_perdida"
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
            <p className="text-xs text-gray-500 mt-1">Solo minúsculas, números y guiones bajos. Máx 512 caracteres</p>
          </div>

          <div>
            <Label htmlFor="category">Categoría *</Label>
            <Select
              value={formData.category}
              onValueChange={(value: TemplateCategory) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UTILITY">Utilidad (facturas, alertas, confirmaciones)</SelectItem>
                <SelectItem value="AUTHENTICATION">Autenticación (códigos OTP)</SelectItem>
                <SelectItem value="MARKETING">Marketing (promociones, ofertas)</SelectItem>
                <SelectItem value="SERVICE">Servicio (actualizaciones de cuenta)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="language">Idioma *</Label>
            <Select value={formData.language} onValueChange={(value) => setFormData({ ...formData, language: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="es">Español</SelectItem>
                <SelectItem value="en">Inglés</SelectItem>
                <SelectItem value="pt">Portugués</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </TabsContent>

        {/* Tab 2: Header */}
        <TabsContent value="header" className="space-y-4">
          <div>
            <Label htmlFor="header_type">Tipo de Header</Label>
            <Select
              value={formData.header_type}
              onValueChange={(value: HeaderType) => setFormData({ ...formData, header_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">Sin header</SelectItem>
                <SelectItem value="TEXT">Texto</SelectItem>
                <SelectItem value="IMAGE">Imagen</SelectItem>
                <SelectItem value="VIDEO">Video</SelectItem>
                <SelectItem value="DOCUMENT">Documento PDF</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.header_type === "TEXT" && (
            <div>
              <Label htmlFor="header_text">Texto del Header</Label>
              <Input
                id="header_text"
                value={formData.header_text}
                onChange={(e) => setFormData({ ...formData, header_text: e.target.value })}
                placeholder="Título del mensaje"
                maxLength={60}
                className={errors.header_text ? "border-red-500" : ""}
              />
              {errors.header_text && <p className="text-sm text-red-600 mt-1">{errors.header_text}</p>}
              <p className="text-xs text-gray-500 mt-1">{formData.header_text.length}/60 caracteres</p>
            </div>
          )}

          {(formData.header_type === "IMAGE" ||
            formData.header_type === "VIDEO" ||
            formData.header_type === "DOCUMENT") && (
              <div>
                <Label htmlFor="header_media_url">URL del archivo</Label>
                <Input
                  id="header_media_url"
                  type="url"
                  value={formData.header_media_url}
                  onChange={(e) => setFormData({ ...formData, header_media_url: e.target.value })}
                  placeholder="https://ejemplo.com/archivo.jpg"
                />
                <p className="text-xs text-gray-500 mt-1">Debe ser una URL pública accesible</p>
              </div>
            )}
        </TabsContent>

        {/* Tab 3: Body */}
        <TabsContent value="body" className="space-y-4">
          <div>
            <Label htmlFor="body">Contenido del Mensaje *</Label>
            <Textarea
              id="body"
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              placeholder="Hola {{1}}, vimos que nos llamaste pero no pudimos atenderte..."
              rows={8}
              maxLength={1024}
              className={errors.body ? "border-red-500" : ""}
            />
            {errors.body && <p className="text-sm text-red-600 mt-1">{errors.body}</p>}
            <p className="text-xs text-gray-500 mt-1">
              {formData.body.length}/1024 caracteres. Usa variables como {`{{1}}, {{2}}, {{3}}`}
            </p>
          </div>

          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-900 font-medium mb-1">💡 Tip:</p>
            <p className="text-xs text-blue-800">
              Incluye un call-to-action claro y un enlace para reservar o contactar
            </p>
          </div>
        </TabsContent>

        {/* Tab 4: Footer & Botones */}
        <TabsContent value="footer" className="space-y-4">
          <div>
            <Label htmlFor="footer">Footer (opcional)</Label>
            <Input
              id="footer"
              value={formData.footer}
              onChange={(e) => setFormData({ ...formData, footer: e.target.value })}
              placeholder="Texto que aparece al final"
              maxLength={60}
              className={errors.footer ? "border-red-500" : ""}
            />
            {errors.footer && <p className="text-sm text-red-600 mt-1">{errors.footer}</p>}
            <p className="text-xs text-gray-500 mt-1">{formData.footer?.length || 0}/60 caracteres</p>
          </div>

          <div>
            <Label>Botones (máximo 3)</Label>
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
                        <SelectItem value="QUICK_REPLY">Respuesta Rápida</SelectItem>
                        <SelectItem value="PHONE_NUMBER">Llamar</SelectItem>
                        <SelectItem value="URL">Visitar Web</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Texto del botón"
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
                    Eliminar
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
                  Agregar Botón
                </Button>
              )}
            </div>
            {errors.buttons && <p className="text-sm text-red-600 mt-1">{errors.buttons}</p>}
          </div>
        </TabsContent>
      </Tabs>

      {/* Preview */}
      <div className="mt-6 p-4 bg-gray-100 rounded-lg">
        <Label className="text-sm font-semibold mb-2 block">Vista Previa WhatsApp</Label>
        <div className="bg-white rounded-lg p-4 shadow-sm max-w-md">
          {formData.header_type === "TEXT" && formData.header_text && (
            <div className="font-bold text-gray-900 mb-2">{formData.header_text}</div>
          )}
          {formData.header_type === "IMAGE" && (
            <div className="bg-gray-200 h-32 rounded mb-2 flex items-center justify-center text-gray-500">Imagen</div>
          )}
          <div className="text-gray-800 whitespace-pre-wrap mb-2">
            {formData.body || "Tu mensaje aparecerá aquí..."}
          </div>
          {formData.footer && <div className="text-xs text-gray-500 mb-3">{formData.footer}</div>}
          {formData.buttons.length > 0 && (
            <div className="space-y-1">
              {formData.buttons.map((btn, idx) => (
                <button
                  key={idx}
                  className="w-full py-2 text-center text-blue-600 border border-gray-300 rounded font-medium text-sm"
                >
                  {btn.text || "Botón"}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 mt-6">
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} className="bg-red-600 hover:bg-red-700 text-white">
          {template ? "Guardar Cambios" : "Crear Template"}
        </Button>
      </div>
    </div>
  )
}
