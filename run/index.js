
    /** 一些任务，分配给A、B、C
     *   A: 整理A数据，并从小到大进行排序 --------- 所需时间估计 1000ms ~ 2000ms
     *   B: 整理B数据，并从小到大进行排序 --------- 所需时间估计 1000ms ~ 2000ms
     *   C: 将整理之后数据相加并乘以系数ratio ----- 所需时间估计  500ms ~ 1000ms
     */
    let works = {
        A: [ 9, 10, 19, 15, 16, 7, 18, 13 ],
        B: [ 13, 11, 5, 7, 9, 20, 10, 11],
        C: { ratio: 2 }
    };
    let roles = {
        A_Work: function(notice) {
            // 1) A开始工作...
            console.log('  ' + new Date().getTime() + ' - 角色A开始整理A数据...');
            // 2) A工作时间...
            setTimeout(function(){
                let AData = works.A.sort(function(a,b){return a > b});
                // 3) A工作完成...
                console.log('  ' + new Date().getTime() + ' - 角色A工作完成: ' + AData.join(","));
                notice(AData);
            }, parseInt(Math.random()*(2000 - 1000 + 1) + 1000, 10));
        },
        B_Work: function(notice) {
            // 1) B开始工作...
            console.log('  ' + new Date().getTime() + ' - 角色B开始整理B数据...');
            // 2) B工作时间...
            setTimeout(function(){
                let BData = works.B.sort(function(a,b){return a > b});
                // 3) B作完成...
                console.log('  ' + new Date().getTime() + ' - 角色B工作完成: ' + BData.join(","));
                notice(BData);
            }, parseInt(Math.random()*(2000 - 1000 + 1) + 1000, 10));
        },
        C_Work: function(AData, BData, notice){
            // 1) C开始工作...
            console.log('  ' + new Date().getTime() + ' - 角色C开始处理A、B数据...');
            // 2) C工作时间...
            setTimeout(function(){
                let CData = [];
                for(let i=0, l=8; i<l; i++){
                    let ratio = works.C.ratio;
                    let plus = AData[i] + BData[i];
                    CData.push(plus * ratio);
                }
                // 3) C工作完成...
                console.log('  ' + new Date().getTime() + ' - 角色C的工作完成: ' + CData.join(","));
                notice(AData, BData, CData);
            }, parseInt(Math.random()*(1000 - 500 + 1) + 500, 10))
        }
    };


    /** iPromise 监管 A、B、C工作 */
    var compileA_Work = iPromise.compile(roles.A_Work);
    var compileB_Work = iPromise.compile(roles.B_Work);
    var compileC_Work = iPromise.compile(roles.C_Work);


    /** 简述模拟工作场景... */
    console.log('\n数据如下: ');
    console.log('  A数据 [ 9, 10, 19, 15, 16, 7, 18, 13 ] ');
    console.log('  B数据 [ 13, 11, 5, 7, 9, 20, 10, 11] ');
    console.log('  C数据 { ratio: 2 } ');
    console.log('\n任务如下: ');
    console.log('  A: 整理A部分数据，并从小到大进行排序，所需时间1000ms ~2000ms');
    console.log('  B: 整理B部分数据，并从小到大进行排序，所需时间1000ms ~2000ms');
    console.log('  C: 将A、B两者整理之后数据，一一相加并乘以系数ratio，所需时间500ms ~1000ms');
    console.log('\n运行如下: ');


    /** 开始模拟工作场景... */
    let A_State = compileA_Work();
    let B_State = compileB_Work();
    iPromise.all([ A_State, B_State ])
        .then(function(AData, BData){
            return compileC_Work(AData, BData);
        });



