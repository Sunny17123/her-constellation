import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useGlobeSelection } from "@/hooks/useGlobeSelection";
import { getPersonById } from "@/data/load";

const PERSON_PATH = /^\/person\/([a-z0-9_]+)$/;

/**
 * 深链同步：URL ↔ 选中状态双向绑定（/person/:id 可分享、刷新可恢复）
 *
 * 两个 effect 各管一个方向，用 ref 镜像避免循环：
 * - Effect A（URL→state）：deps 仅 [pathname] —— 光点点击触发的选中
 *   不会被 A 因同一 pathname 变化而重复覆盖（重复 selectPerson 会清掉
 *   DetailPanel 刚点亮的联结高亮，故必须比较 stateRef 后跳过）
 * - Effect B（state→URL）：selectedId 变化时写 URL（replace:false，
 *   浏览器返回键可逐级回退）；/network 豁免（NetworkGraph 自管选中）
 */
export default function DeepLinkSync() {
  const { selectedId, selectPerson } = useGlobeSelection();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // 始终最新值，不触发 effect 重跑
  const stateRef = useRef(selectedId);
  const pathRef = useRef(pathname);

  // 镜像（先声明，保证 A/B 拿到最新值）
  useEffect(() => {
    stateRef.current = selectedId;
  }, [selectedId]);

  // Effect A: URL -> state
  useEffect(() => {
    pathRef.current = pathname;
    const m = PERSON_PATH.exec(pathname);
    if (m) {
      const id = m[1];
      if (!getPersonById(id)) {
        navigate("/", { replace: true }); // 无效深链：回首页
        return;
      }
      if (stateRef.current !== id) selectPerson(id);
    } else if (pathname === "/") {
      if (stateRef.current !== null) selectPerson(null);
    }
    // /network 与其他路径：不动选中
  }, [pathname]);

  // Effect B: state -> URL
  useEffect(() => {
    const path = pathRef.current;
    if (path.startsWith("/network")) return;
    const m = PERSON_PATH.exec(path);
    if (m && selectedId === null) return; // 挂载在途：A 的 selectPerson 尚未生效
    const target = selectedId ? `/person/${selectedId}` : "/";
    if (path !== target) navigate(target);
  }, [selectedId]);

  return null;
}
