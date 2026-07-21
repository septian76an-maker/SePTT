const fs = require('fs');
let content = fs.readFileSync('src/components/AdminLayout.tsx', 'utf8');
content = content.replace(
`                    )}
                  </div>
                  <div className="max-h-96 overflow-y-auto">`,
`                    )}
                    </div>
                    {visibleNotifications.length > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="w-full text-right text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-medium"
                      >
                        Tandai sudah dibaca
                      </button>
                    )}
                  </div>
                  <div className="max-h-96 overflow-y-auto">`
);
fs.writeFileSync('src/components/AdminLayout.tsx', content);
