"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { IconButton } from "@/components/ui/icon-button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Checkbox, CheckboxWithLabel } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem, RadioGroupItemWithLabel } from "@/components/ui/radio"
import { Switch, SwitchWithLabel } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { Slider } from "@/components/ui/slider"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { Tooltip } from "@/components/ui/tooltip"
import { FormField } from "@/components/ui/form-field"
import { EmptyState } from "@/components/ui/empty-state"
import { Logo } from "@/components/ui/logo"
import { PricingCard } from "@/components/ui/pricing-card"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Plus, Search, ArrowRight, Trash2, MoreHorizontal, Settings,
  User, Mail, Lock, Eye, ChevronDown, Inbox, Star, Check
} from "lucide-react"

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight text-foreground">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  )
}

function Row({ label, children }: { label?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      {label && <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>}
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  )
}

export default function ShowcasePage() {
  const [progress, setProgress] = useState(65)
  const [sliderVal, setSliderVal] = useState([50])
  const [checked, setChecked] = useState(true)
  const [radio, setRadio] = useState("a")
  const [switchOn, setSwitchOn] = useState(true)
  const [tab, setTab] = useState("tab1")

  return (
    <main className="min-h-screen bg-background py-16 px-6">
      <div className="max-w-5xl mx-auto space-y-16">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
            Navix Design System
          </h1>
          <p className="text-lg text-muted-foreground">
            Compare these components with the Figma designs
          </p>
        </div>

        <Separator />

        {/* Logo */}
        <Section title="Logo">
          <Row>
            <Logo size="sm" />
            <Logo size="md" />
            <Logo size="lg" />
            <Logo size="sm" showText />
            <Logo size="md" showText />
            <Logo size="lg" showText />
          </Row>
        </Section>

        <Separator />

        {/* Buttons Primary / Secondary / Tertiary / Quaternary / Destructive */}
        <Section title="Buttons">
          <Row label="Primary">
            <Button variant="primary" size="sm"><Plus className="h-3.5 w-3.5" /> Label</Button>
            <Button variant="primary" size="md"><Plus className="h-4 w-4" /> Label</Button>
            <Button variant="primary" size="lg"><Plus className="h-5 w-5" /> Label</Button>
            <Button variant="primary" size="md" disabled><Plus className="h-4 w-4" /> Label</Button>
          </Row>
          <Row label="Secondary">
            <Button variant="secondary" size="sm">Label</Button>
            <Button variant="secondary" size="md">Label</Button>
            <Button variant="secondary" size="lg">Label</Button>
            <Button variant="secondary" size="md" disabled>Label</Button>
          </Row>
          <Row label="Tertiary">
            <Button variant="tertiary" size="sm">Label</Button>
            <Button variant="tertiary" size="md">Label</Button>
            <Button variant="tertiary" size="lg">Label</Button>
            <Button variant="tertiary" size="md" disabled>Label</Button>
          </Row>
          <Row label="Quaternary">
            <Button variant="quaternary" size="sm">Label</Button>
            <Button variant="quaternary" size="md">Label</Button>
            <Button variant="quaternary" size="lg">Label</Button>
            <Button variant="quaternary" size="md" disabled>Label</Button>
          </Row>
          <Row label="Destructive">
            <Button variant="destructive" size="sm"><Trash2 className="h-3.5 w-3.5" /> Label</Button>
            <Button variant="destructive" size="md"><Trash2 className="h-4 w-4" /> Label</Button>
            <Button variant="destructive" size="lg"><Trash2 className="h-5 w-5" /> Label</Button>
            <Button variant="destructive" size="md" disabled>Label</Button>
          </Row>
        </Section>

        <Separator />

        {/* Icon Buttons */}
        <Section title="Icon Buttons">
          <Row label="Primary">
            <IconButton variant="primary" size="sm"><Plus /></IconButton>
            <IconButton variant="primary" size="md"><Plus /></IconButton>
            <IconButton variant="primary" size="lg"><Plus /></IconButton>
            <IconButton variant="primary" size="md" disabled><Plus /></IconButton>
          </Row>
          <Row label="Secondary / Tertiary / Quaternary / Destructive">
            <IconButton variant="secondary" size="md"><Search /></IconButton>
            <IconButton variant="tertiary" size="md"><Settings /></IconButton>
            <IconButton variant="quaternary" size="md"><MoreHorizontal /></IconButton>
            <IconButton variant="destructive" size="md"><Trash2 /></IconButton>
          </Row>
        </Section>

        <Separator />

        {/* Input */}
        <Section title="Input">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl">
            <FormField label="Default" helperText="Helper text">
              <Input size="lg" placeholder="Placeholder" leadIcon={<Search className="h-5 w-5" />} tailIcon={<Eye className="h-5 w-5" />} />
            </FormField>
            <FormField label="Filled">
              <Input size="lg" defaultValue="john@example.com" leadIcon={<Mail className="h-5 w-5" />} />
            </FormField>
            <FormField label="Error" error="This field is required">
              <Input size="lg" error placeholder="Placeholder" leadIcon={<Mail className="h-5 w-5" />} />
            </FormField>
            <FormField label="Disabled">
              <Input size="lg" disabled placeholder="Disabled" leadIcon={<Lock className="h-5 w-5" />} />
            </FormField>
            <FormField label="Size md">
              <Input size="md" placeholder="Smaller input" />
            </FormField>
            <FormField label="Size lg">
              <Input size="lg" placeholder="Larger input" />
            </FormField>
          </div>
        </Section>

        <Separator />

        {/* Textarea */}
        <Section title="Textarea">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl">
            <FormField label="Default" helperText="Helper text">
              <Textarea placeholder="Placeholder" />
            </FormField>
            <FormField label="Error" error="Required field">
              <Textarea error placeholder="Placeholder" />
            </FormField>
          </div>
        </Section>

        <Separator />

        {/* Select */}
        <Section title="Select / Dropdown">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl">
            <FormField label="Select option">
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Label</SelectItem>
                  <SelectItem value="2">Label</SelectItem>
                  <SelectItem value="3">Label</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Dropdown menu">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="tertiary" size="md">
                    Select option <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Options</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Label</DropdownMenuItem>
                  <DropdownMenuItem>Label</DropdownMenuItem>
                  <DropdownMenuItem>Label</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </FormField>
          </div>
        </Section>

        <Separator />

        {/* Checkbox */}
        <Section title="Checkbox">
          <Row label="Sizes">
            <Checkbox size="sm" checked={checked} onCheckedChange={() => setChecked(!checked)} />
            <Checkbox size="md" checked={checked} onCheckedChange={() => setChecked(!checked)} />
            <Checkbox size="md" />
            <Checkbox size="md" disabled />
          </Row>
          <Row label="With labels">
            <CheckboxWithLabel label="Label" size="md" checked={checked} onCheckedChange={() => setChecked(!checked)} />
            <CheckboxWithLabel label="Label" size="sm" />
            <CheckboxWithLabel label="Disabled" size="md" disabled />
          </Row>
        </Section>

        <Separator />

        {/* Radio */}
        <Section title="Radio">
          <RadioGroup value={radio} onValueChange={setRadio} className="flex flex-wrap gap-6">
            <RadioGroupItemWithLabel value="a" label="Label" />
            <RadioGroupItemWithLabel value="b" label="Label" />
            <RadioGroupItemWithLabel value="c" label="Label" disabled />
          </RadioGroup>
        </Section>

        <Separator />

        {/* Switch / Toggle */}
        <Section title="Toggle Switch">
          <Row label="Sizes + states">
            <Switch size="sm" checked={switchOn} onCheckedChange={setSwitchOn} />
            <Switch size="md" checked={switchOn} onCheckedChange={setSwitchOn} />
            <Switch size="md" />
            <Switch size="md" disabled />
          </Row>
          <Row label="With labels">
            <SwitchWithLabel label="Label" size="md" checked={switchOn} onCheckedChange={setSwitchOn} />
            <SwitchWithLabel label="Label" size="md" labelPosition="left" checked={switchOn} onCheckedChange={setSwitchOn} />
            <SwitchWithLabel label="Label" size="sm" />
            <SwitchWithLabel label="Disabled" size="md" disabled />
          </Row>
        </Section>

        <Separator />

        {/* Badge */}
        <Section title="Badge">
          <Row>
            <Badge variant="default">Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="accent">Accent</Badge>
          </Row>
          <Row label="Small">
            <Badge variant="default" size="sm">Small</Badge>
            <Badge variant="accent" size="sm">Most popular</Badge>
          </Row>
        </Section>

        <Separator />

        {/* Avatar */}
        <Section title="Avatar">
          <Row>
            <Avatar size="sm"><AvatarFallback>JS</AvatarFallback></Avatar>
            <Avatar size="md"><AvatarFallback>AB</AvatarFallback></Avatar>
            <Avatar size="lg"><AvatarFallback>CD</AvatarFallback></Avatar>
            <Avatar size="xl"><AvatarFallback>EF</AvatarFallback></Avatar>
          </Row>
        </Section>

        <Separator />

        {/* Card */}
        <Section title="Card">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl">
            <Card>
              <CardHeader>
                <CardTitle>Card Title</CardTitle>
                <CardDescription>Card description goes here with some text.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">Card content area</p>
              </CardContent>
              <CardFooter>
                <Button variant="primary" size="sm">Action</Button>
              </CardFooter>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Another Card</CardTitle>
                <CardDescription>With different content inside.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Badge variant="success">Active</Badge>
                  <Badge variant="accent">New</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </Section>

        <Separator />

        {/* Tabs */}
        <Section title="Tabs">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="tab1">Tab 1</TabsTrigger>
              <TabsTrigger value="tab2">Tab 2</TabsTrigger>
              <TabsTrigger value="tab3">Tab 3</TabsTrigger>
            </TabsList>
            <TabsContent value="tab1"><p className="text-sm text-muted-foreground p-4">Content for Tab 1</p></TabsContent>
            <TabsContent value="tab2"><p className="text-sm text-muted-foreground p-4">Content for Tab 2</p></TabsContent>
            <TabsContent value="tab3"><p className="text-sm text-muted-foreground p-4">Content for Tab 3</p></TabsContent>
          </Tabs>
        </Section>

        <Separator />

        {/* Progress */}
        <Section title="Progress">
          <div className="max-w-md space-y-4">
            <Progress value={progress} />
            <Progress value={30} />
            <Progress value={100} />
          </div>
        </Section>

        <Separator />

        {/* Slider */}
        <Section title="Slider">
          <div className="max-w-md">
            <Slider value={sliderVal} onValueChange={setSliderVal} max={100} step={1} />
            <p className="text-sm text-muted-foreground mt-2">Value: {sliderVal[0]}</p>
          </div>
        </Section>

        <Separator />

        {/* Spinner */}
        <Section title="Spinner">
          <Row>
            <Spinner size="sm" />
            <Spinner size="md" />
            <Spinner size="lg" />
          </Row>
        </Section>

        <Separator />

        {/* Tooltip */}
        <Section title="Tooltip">
          <Row>
            <Tooltip content="Top tooltip"><Button variant="tertiary" size="sm">Hover me (top)</Button></Tooltip>
            <Tooltip content="Bottom tooltip" side="bottom"><Button variant="tertiary" size="sm">Hover me (bottom)</Button></Tooltip>
            <Tooltip content="Right tooltip" side="right"><Button variant="tertiary" size="sm">Hover me (right)</Button></Tooltip>
          </Row>
        </Section>

        <Separator />

        {/* Empty State */}
        <Section title="Empty State">
          <EmptyState
            icon={Inbox}
            title="No competitors found"
            description="Start by discovering competitors for your niche."
            action={<Button variant="primary" size="md"><Plus className="h-4 w-4" /> Discover competitors</Button>}
          />
        </Section>

        <Separator />

        {/* Pricing Card */}
        <Section title="Pricing Card">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <PricingCard
              plan="Basic"
              price={48}
              description="Stunning pack of trendy 3D objects"
              features={["Design system", "Components", "Lifetime updates", "Commercial license"]}
              buttonLabel="Get started"
            />
            <PricingCard
              plan="Pro"
              price={48}
              description="Stunning pack of trendy 3D objects"
              features={["Design system", "Components", "Lifetime updates", "Commercial license"]}
              popular
              highlighted
              buttonLabel="Get started"
            />
            <PricingCard
              plan="Enterprise"
              price={48}
              description="Stunning pack of trendy 3D objects"
              features={["Design system", "Components", "Lifetime updates", "Commercial license"]}
              buttonLabel="Get started"
            />
          </div>
        </Section>

        <Separator />

        {/* Separator */}
        <Section title="Separator">
          <div className="max-w-md space-y-4">
            <p className="text-sm">Content above</p>
            <Separator />
            <p className="text-sm">Content below</p>
          </div>
        </Section>

        <div className="h-20" />
      </div>
    </main>
  )
}
