# iPromise 常用静态方法
     * iPromise.all(it); ------------------------------- it:      可迭代对象
     * iPromise.race(it); ------------------------------ it:      可迭代对象
     * iPromise.reject(err); --------------------------- err:     错误信息
     * iPromise.resolve(data); ------------------------- data:    任何数据
     * iPromise.compile(fn, context, bool); ------------ fn:      函数, 
                                                         context: 上下文,
                                                         bool:     应用 error-first 模式
