import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * 渲染期异常兜底：globe 运行时错误、绕过 DataGate 的数据校验失败等
 * 置于应用最外层（DataGate 之外），任何渲染异常都不白屏。
 */
export default class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("应用渲染异常:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#070B14] text-center">
          <div className="space-y-4 px-6">
            <p className="text-4xl">✦</p>
            <p className="font-serif text-2xl text-[#EDEFF5]">星图出错了</p>
            <p className="text-sm text-muted-foreground">
              页面遇到了意外问题，请刷新重试；若持续出现，请联系我们
            </p>
            <button
              onClick={() => window.location.reload()}
              className="rounded-full border border-primary px-6 py-2 text-sm text-primary hover:bg-primary/10"
            >
              刷新页面
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
