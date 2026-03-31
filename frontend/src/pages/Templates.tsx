import { useState, useMemo } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Phone, ExternalLink, MessageSquare, FileText, Filter, ChevronRight, Clock } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { cn } from "@/utils/cn"
import { Link } from "wouter"
import { Helmet } from 'react-helmet-async';

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
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["templates", user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/templates?userId=${user?.id}`)
      if (!response.ok) throw new Error("Error al cargar templates")
      return response.json()
    },
    enabled: !!user,
  })

  const filteredTemplates = useMemo(() => {
    return templates.filter((template: Template) => {
      const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = filterCategory === "all" || template.category === filterCategory
      const matchesStatus = filterStatus === "all" || template.status === filterStatus
      return matchesSearch && matchesCategory && matchesStatus
    })
  }, [templates, searchTerm, filterCategory, filterStatus])

  return (
    <>
      <Helmet>
        <title>{t('templates.title')} - UNMI</title>
      </Helmet>

      <div className="flex flex-col gap-y-8 pb-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center border border-slate-100">
              <FileText className="h-6 w-6 text-[#003366]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 leading-tight">
                {t('templates.title')}
              </h2>
              <p className="text-sm font-medium text-slate-400">Mensajes predefinidos para WhatsApp</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative hidden md:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Buscar plantilla..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="rounded-2xl border-none shadow-sm h-12 pl-11 bg-white w-64" 
              />
            </div>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-2xl bg-[#003366] hover:bg-blue-900 text-white h-12 px-6 font-bold shadow-lg shadow-blue-900/20">
                  <Plus className="h-4 w-4 mr-2" /> {t('templates.new')}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] p-10 border-none">
                <TemplateFormDialog onClose={() => setIsCreateOpen(false)} template={selectedTemplate} />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filters Card */}
        <Card className="rounded-[2rem] border-none bg-white p-6 shadow-sm flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2 mr-4">
            <Filter className="h-4 w-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Filtros</span>
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[200px] rounded-xl bg-slate-50 border-none h-10 px-4 font-bold">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              <SelectItem value="UTILITY">Utilidad</SelectItem>
              <SelectItem value="MARKETING">Marketing</SelectItem>
              <SelectItem value="SERVICE">Servicio</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[200px] rounded-xl bg-slate-50 border-none h-10 px-4 font-bold">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="APPROVED">Aprobadas</SelectItem>
              <SelectItem value="PENDING">Pendientes</SelectItem>
              <SelectItem value="REJECTED">Rechazadas</SelectItem>
            </SelectContent>
          </Select>
        </Card>

        {/* Templates Grid */}
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => <div key={i} className="animate-pulse h-64 bg-white rounded-[2.5rem]" />)}
          </div>
        ) : filteredTemplates.length === 0 ? (
          <Card className="rounded-[2.5rem] border-none bg-white py-24 shadow-sm text-center">
            <MessageSquare className="h-20 w-20 mx-auto text-slate-100 mb-6" />
            <h3 className="text-2xl font-black text-slate-900 mb-2">{t('templates.noTemplates')}</h3>
            <p className="text-slate-400 mb-8 max-w-sm mx-auto">{t('templates.firstTemplate')}</p>
            <Button onClick={() => setIsCreateOpen(true)} className="rounded-2xl bg-[#003366] text-white h-14 px-10 font-bold text-lg shadow-xl shadow-blue-900/20">
              {t('templates.create')}
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template: Template) => (
              <Card 
                key={template.id} 
                className="rounded-[2.5rem] border-none bg-white p-8 shadow-sm transition-hover hover:shadow-md cursor-pointer group"
                onClick={() => { setSelectedTemplate(template); setIsCreateOpen(true); }}
              >
                <div className="flex items-start justify-between mb-6">
                  <div className={cn("inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase", 
                    template.status === 'APPROVED' ? "bg-emerald-50 text-emerald-600" : 
                    template.status === 'PENDING' ? "bg-amber-50 text-amber-600" : "bg-rose-50 text-red-600"
                  )}>
                    {template.status}
                  </div>
                  <Badge variant="outline" className="border-slate-100 text-slate-400 text-[10px] font-bold uppercase">{template.category}</Badge>
                </div>
                
                <h3 className="text-lg font-bold text-slate-900 mb-4 group-hover:text-[#003366] transition-colors line-clamp-1">{template.name}</h3>
                
                <div className="bg-slate-50 rounded-2xl p-4 mb-6 relative min-h-[100px]">
                  <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed italic">"{template.body}"</p>
                </div>

                <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
                    <Clock className="h-3 w-3" />
                    {new Date(template.created_at).toLocaleDateString()}
                  </div>
                  <span className="text-sm font-bold text-[#003366] group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    Editar <ChevronRight className="h-4 w-4" />
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

function TemplateFormDialog({ onClose, template }: { onClose: () => void; template: Template | null }) {
  const { t } = useTranslation()
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
    if (!/^[a-z0-9_]+$/.test(name)) return "Solo minúsculas, números y guiones bajos"
    return ""
  }

  const handleSubmit = async () => {
    onClose()
  }

  return (
    <div className="space-y-8">
      <DialogHeader>
        <DialogTitle className="text-2xl font-black text-[#003366]">{template ? 'Editar Plantilla' : 'Nueva Plantilla'}</DialogTitle>
      </DialogHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
        <TabsList className="bg-slate-100 p-1 rounded-2xl grid w-full grid-cols-4 mb-8">
          <TabsTrigger value="basic" className="rounded-xl font-bold">Básico</TabsTrigger>
          <TabsTrigger value="header" className="rounded-xl font-bold">Encabezado</TabsTrigger>
          <TabsTrigger value="body" className="rounded-xl font-bold">Cuerpo</TabsTrigger>
          <TabsTrigger value="footer" className="rounded-xl font-bold">Pie</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-6">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nombre único</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") })}
              placeholder="ej: recordatorio_cita"
              className="h-12 rounded-2xl bg-slate-50 border-none font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Categoría Meta</Label>
              <Select value={formData.category} onValueChange={(val: any) => setFormData({ ...formData, category: val })}>
                <SelectTrigger className="h-12 rounded-2xl bg-slate-50 border-none font-bold px-4"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTILITY">Utilidad</SelectItem>
                  <SelectItem value="MARKETING">Marketing</SelectItem>
                  <SelectItem value="SERVICE">Servicio</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Idioma</Label>
              <Select value={formData.language} onValueChange={(val) => setFormData({ ...formData, language: val })}>
                <SelectTrigger className="h-12 rounded-2xl bg-slate-50 border-none font-bold px-4"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="es">Español</SelectItem><SelectItem value="en">Inglés</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="header" className="space-y-6">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tipo de Encabezado</Label>
            <Select value={formData.header_type} onValueChange={(val: any) => setFormData({ ...formData, header_type: val })}>
              <SelectTrigger className="h-12 rounded-2xl bg-slate-50 border-none font-bold px-4"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">Sin encabezado</SelectItem>
                <SelectItem value="TEXT">Texto</SelectItem>
                <SelectItem value="IMAGE">Imagen</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {formData.header_type === 'TEXT' && (
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Texto del encabezado</Label>
              <Input value={formData.header_text} onChange={(e) => setFormData({ ...formData, header_text: e.target.value })} className="h-12 rounded-2xl bg-slate-50 border-none font-bold" />
            </div>
          )}
        </TabsContent>

        <TabsContent value="body" className="space-y-6">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Contenido del mensaje</Label>
            <Textarea 
              value={formData.body} 
              onChange={(e) => setFormData({ ...formData, body: e.target.value })} 
              rows={6}
              className="rounded-2xl bg-slate-50 border-none font-medium leading-relaxed" 
            />
            <p className="text-[10px] text-slate-400 font-medium italic">Puedes usar variables como {'{{1}}'}, {'{{2}}'} para personalizar el mensaje.</p>
          </div>
        </TabsContent>

        <TabsContent value="footer" className="space-y-6">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pie de página (Opcional)</Label>
            <Input value={formData.footer} onChange={(e) => setFormData({ ...formData, footer: e.target.value })} className="h-12 rounded-2xl bg-slate-50 border-none font-bold" />
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex gap-3 pt-6">
        <Button variant="outline" onClick={onClose} className="flex-1 h-12 rounded-2xl font-bold">Cancelar</Button>
        <Button onClick={handleSubmit} className="flex-1 h-12 rounded-2xl bg-[#003366] text-white font-bold shadow-lg shadow-blue-900/20">Guardar Cambios</Button>
      </div>
    </div>
  )
}
