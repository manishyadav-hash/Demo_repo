const zod_1 = require("zod");

exports.updateLocationSchema = zod_1.z.object({
    latitude: zod_1.z
        .number()
        .min(-90, "Latitude must be between -90 and 90")
        .max(90, "Latitude must be between -90 and 90"),
    longitude: zod_1.z
        .number()
        .min(-180, "Longitude must be between -180 and 180")
        .max(180, "Longitude must be between -180 and 180"),
    address: zod_1.z.string().optional(),
    city: zod_1.z.string().optional(),
    country: zod_1.z.string().optional(),
    isShared: zod_1.z.boolean().optional(),
});

exports.toggleSharingSchema = zod_1.z.object({
    isShared: zod_1.z.boolean(),
});
