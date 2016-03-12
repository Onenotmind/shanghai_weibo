var Util = {
	
	colors : ['red', 'orange', 'yellow', 'olive', 'green', 'teal', 'blue', 'violet', 'purple', 'pink', 'brown', 'grey', 'black'],

	translator: {

		activities: {	
					"At Work": "工作",
					"At School": "上学",
					"Home(Including Dormitories)": "家（含宿舍）",
					"At Friends' Home": "朋友家",
					"Staying at Hotels": "住酒店",
					"Breakfast": "早餐",
					"Lunch": "中餐",
					"Supper": "晚餐",
					"Snack/Cold Drinks": "零食/冷饮",
					"Coffee/Tea": "喝咖啡/喝茶",
					"In the Bookstore/Library": "逛书店/图书馆",
					"Buying Clothing,shoes,hats or Jewelry/Generally Shopping": "买服装鞋帽首饰/一般逛商店",
					"Shopping Supermarket": "逛超市",
					"Convenience Store Shopping": "便利店购物",
					"Buy Electronics/Digital Products": "买电器/数码产品",
					"Sports(Playing, Running, Dancing, Yoga, etc)": "体育运动（打球，跑步，跳舞，瑜伽等）",
					"Outdoor/Park/Tour Scenic Spot": "户外/逛公园/游览景区",
					"Seeing the Exhibition": "看展览",
					"Watching Performance": "看表演",
					"Seeing a Movie": "看电影",
					"Watching Sports": "看体育比赛",
					"Karaoke": "KTV",
					"Other Entertainments": "其它娱乐",
					"Take the Bus/Subway": "坐公交/地铁",
					"Waiting for the Plane/Ship/Train": "等飞机/等船/火车",
					"At the Bank": "去银行办理业务",
					"Seeing a Doctor": "看病",
					"Hair/Beauty/Massage": "理发/美容/按摩",
					"Drive Midway(Refuelling, Traffic jam)": "开车中途（加油，堵车等待）",
					"Buy Tickets": "买票",
					"Car Purchase and Maintenance": "汽车购买保养",
					"Others": "其他",
					"Photography/Dry Cleaning": "照相/干洗等生活相关"
		},

		e2c: function(en) {
			if (Array.isArray(en) == false)
				return this.activities[en];
			else {
				var array_cn = [];
				var array_en = en;
				for (var i = 0; i < array_en.length; i++)
					array_cn.push(this.activities[array_en[i]]);
				return array_cn;
			}
		},

		c2e: function(cn) {
			if (Array.isArray(cn) == false) {
				for (en in this.activities)
					if (this.activities[en] == cn)
						return en;
			} else {
				var array_en = [];
				var array_cn = cn;
				for (en in this.activities) {
					var index = array_cn.indexOf(this.activities[en]);
					if (index == -1)
						continue;
					else
						array_en[index] = en;
				}

				return array_en;
			}
		}
	}
	
};