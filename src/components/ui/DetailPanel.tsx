import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowLeft } from "lucide-react";
import { useGlobeSelection } from "@/hooks/useGlobeSelection";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import PersonDetailContent from "@/components/ui/PersonDetailContent";

interface DetailPanelProps {
  onClose: () => void;
}

export default function DetailPanel({ onClose }: DetailPanelProps) {
  const isMobile = useMediaQuery("(max-width: 767px)");
  const {
    selectedId,
    selectPerson,
    selectConnection,
    allPeople,
    getEchoes,
    getEchoTarget,
  } = useGlobeSelection();

  const person = selectedId
    ? allPeople.find((p) => p.id === selectedId) ?? null
    : null;

  const echoes = selectedId ? getEchoes(selectedId) : [];

  const handleEchoClick = (connectionId: string) => {
    const connection = echoes.find((c) => c.id === connectionId);
    if (!connection || !selectedId) return;
    const target = getEchoTarget(connection, selectedId);
    if (target) {
      selectConnection(connectionId);
      setTimeout(() => {
        selectPerson(target.id);
      }, 600);
    }
  };

  if (!person) return null;

  return (
    <>
      {/* 桌面端：右侧面板 */}
      {!isMobile && (
        <AnimatePresence>
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/20"
              onClick={onClose}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-[440px] max-w-[90vw] bg-card/95 backdrop-blur-xl border-l border-border shadow-2xl flex flex-col"
            >
              {/* 顶部导航 */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="gap-2 text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4" />
                  返回地球
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <ScrollArea className="flex-1">
                <div className="px-6 py-6">
                  <PersonDetailContent
                    person={person}
                    echoes={echoes}
                    getEchoTarget={getEchoTarget}
                    onEchoClick={handleEchoClick}
                    variant="panel"
                  />
                </div>
              </ScrollArea>
            </motion.div>
          </>
        </AnimatePresence>
      )}

      {/* 移动端：全屏底部抽屉 */}
      {isMobile && (
        <Drawer
          open={true}
          onOpenChange={(open) => {
            if (!open) onClose();
          }}
        >
          <DrawerContent className="h-[92dvh] flex flex-col">
            <DrawerHeader className="flex-shrink-0 pb-2">
              <DrawerTitle className="sr-only">
                {person.name_zh} 详情
              </DrawerTitle>
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="gap-2 text-muted-foreground"
                >
                  <ArrowLeft className="h-4 w-4" />
                  返回
                </Button>
              </div>
            </DrawerHeader>
            <ScrollArea className="flex-1 px-6">
              <PersonDetailContent
                person={person}
                echoes={echoes}
                getEchoTarget={getEchoTarget}
                onEchoClick={handleEchoClick}
                variant="panel"
              />
            </ScrollArea>
          </DrawerContent>
        </Drawer>
      )}
    </>
  );
}
