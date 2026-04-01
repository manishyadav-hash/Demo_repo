import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";

const NotificationToast = ({ 
  message, 
  senderName, 
  senderAvatar,
  onDismiss,
  autoCloseDuration = 4000 
}) => {
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      onDismiss?.();
    }, 300);
  }, [onDismiss]);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, autoCloseDuration);

    return () => clearTimeout(timer);
  }, [autoCloseDuration, handleClose]);

  // Truncate message to reasonable length
  const displayMessage = message.length > 100 
    ? message.substring(0, 100) + "..." 
    : message;

  return (
    _jsxs("div", {
      className: `fixed top-4 right-4 z-50 max-w-sm bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300 ${
        isClosing 
          ? "opacity-0 translate-x-96" 
          : "opacity-100 translate-x-0"
      }`,
      children: [
        _jsxs("div", {
          className: "flex items-start gap-3 p-4",
          children: [
            // Avatar
            _jsx("div", {
              className: "flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center overflow-hidden",
              children: senderAvatar ? (
                _jsx("img", {
                  src: senderAvatar,
                  alt: senderName,
                  className: "w-full h-full object-cover"
                })
              ) : (
                _jsx("div", {
                  className: "w-full h-full flex items-center justify-center text-white font-bold text-lg",
                  children: senderName?.charAt(0).toUpperCase()
                })
              )
            }),
            // Message content
            _jsxs("div", {
              className: "flex-1 min-w-0",
              children: [
                _jsx("p", {
                  className: "text-sm font-semibold text-gray-900 dark:text-white truncate",
                  children: senderName
                }),
                _jsx("p", {
                  className: "text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-1",
                  children: displayMessage
                })
              ]
            }),
            // Close button
            _jsx("button", {
              onClick: handleClose,
              className: "flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors",
              children: _jsx(X, { size: 18 })
            })
          ]
        }),
        // Dismiss animation bar
        _jsx("div", {
          className: "h-1 bg-gradient-to-r from-green-500 to-blue-500",
          style: {
            animation: isClosing ? "none" : `shrink ${autoCloseDuration}ms linear forwards`,
            transformOrigin: "left"
          }
        })
      ]
    })
  );
};

export default NotificationToast;
