"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export function useConfirm() {
  const [state, setState] = useState<{
    open: boolean
    title: string
    message: string
    onConfirm?: () => void
  }>({ open: false, title: "", message: "" })

  const confirm = (title: string, message: string) =>
    new Promise<boolean>((resolve) => {
      setState({
        open: true,
        title,
        message,
        onConfirm: () => resolve(true),
      })
    })

  const ConfirmDialog = () => (
    <Dialog
      open={state.open}
      onOpenChange={() => setState((s) => ({ ...s, open: false }))}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{state.title}</DialogTitle>
          <DialogDescription>{state.message}</DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setState((s) => ({ ...s, open: false }))
              state.onConfirm && state.onConfirm()
            }}
          >
            Confirmar
          </Button>

          <Button
            variant="ghost"
            onClick={() => setState((s) => ({ ...s, open: false }))}
          >
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  return { confirm, ConfirmDialog }
}
