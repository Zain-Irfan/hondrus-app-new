import { Router, type IRouter } from "express";
import healthRouter from "./health";
import productsRouter from "./products";
import storeRouter from "./store";
import cartRouter from "./cart";
import ordersRouter from "./orders";
import accountRouter from "./account";
import adminRouter from "./admin";
import storageRouter from "./storage";
import stripePaymentRouter from "./stripe-payment";
import paymentPageRouter from "./payment-page";
import placesRouter from "./places";

const router: IRouter = Router();

router.use(healthRouter);
router.use(productsRouter);
router.use(storeRouter);
router.use(cartRouter);
router.use(ordersRouter);
router.use(accountRouter);
router.use(adminRouter);
router.use(storageRouter);
router.use(stripePaymentRouter);
router.use(paymentPageRouter);
router.use(placesRouter);

export default router;
